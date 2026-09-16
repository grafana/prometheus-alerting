import { parseFlags } from '@grafana/data';
import type { RouteWithID as AlertmanagerRouteWithID } from '@grafana/external-alertmanager/mimir';
import { normalizeMatchers, type AlertGroup, type ObjectMatcher } from '@grafana/external-alertmanager/vanilla';

export type RouteMatchingCounts = Map<string, number>;

type CompiledMatcher = {
  label: string;
  matches: (value: string) => boolean;
};

type InvalidMatcher = {
  error: unknown;
  label: string;
};

type CompiledRoute = {
  continue: boolean;
  id: string;
  invalidMatchers?: InvalidMatcher[];
  matchers: CompiledMatcher[];
  routes: CompiledRoute[];
};

function compileRoute(route: AlertmanagerRouteWithID): CompiledRoute {
  const invalidMatchers: InvalidMatcher[] = [];
  const matchers = normalizeMatchers(route).map((matcher) => compileMatcher(matcher, invalidMatchers));

  return {
    continue: route.continue ?? false,
    id: route.id,
    ...(invalidMatchers.length > 0 ? { invalidMatchers } : {}),
    matchers,
    routes: route.routes?.map(compileRoute) ?? [],
  };
}

function compileMatcher([label, operator, value]: ObjectMatcher, invalidMatchers: InvalidMatcher[]): CompiledMatcher {
  if (operator === '=') {
    return { label, matches: (labelValue) => labelValue === value };
  }
  if (operator === '!=') {
    return { label, matches: (labelValue) => labelValue !== value };
  }

  try {
    const { cleaned, flags } = parseFlags(`^(?:${value})$`);
    const regex = new RegExp(cleaned, flags);
    const matches = operator === '=~' ? matchesRegex(regex) : doesNotMatchRegex(regex);
    return { label, matches };
  } catch (error) {
    invalidMatchers.push({ error, label });
    return { label, matches: () => false };
  }
}

function matchesRegex(regex: RegExp): (value: string) => boolean {
  return (value) => {
    regex.lastIndex = 0;
    return regex.test(value);
  };
}

function doesNotMatchRegex(regex: RegExp): (value: string) => boolean {
  return (value) => {
    regex.lastIndex = 0;
    return !regex.test(value);
  };
}

function routeMatches(route: CompiledRoute, labels: Record<string, string>): boolean {
  let matches = true;
  for (const matcher of route.matchers) {
    if (!matcher.matches(labels[matcher.label] || '')) {
      matches = false;
      break;
    }
  }

  // Upstream builds diagnostics after its boolean pass. That second pass throws for an invalid
  // regex only when the named label exists, including matchers after an earlier failed conjunct.
  if (route.invalidMatchers) {
    for (const matcher of route.invalidMatchers) {
      if (Object.prototype.propertyIsEnumerable.call(labels, matcher.label)) {
        throw matcher.error;
      }
    }
  }

  return matches;
}

function countMatches(route: CompiledRoute, labels: Record<string, string>, counts: RouteMatchingCounts): boolean {
  if (!routeMatches(route, labels)) {
    return false;
  }

  let hasMatchingChild = false;
  for (const child of route.routes) {
    if (countMatches(child, labels, counts)) {
      hasMatchingChild = true;
      if (!child.continue) {
        break;
      }
    }
  }

  if (!hasMatchingChild) {
    counts.set(route.id, (counts.get(route.id) ?? 0) + 1);
  }

  return true;
}

/** Count unique Alertmanager alert instances at their selected destination routes. */
export function countRouteMatches(
  routeTree: AlertmanagerRouteWithID | undefined,
  alertGroups: AlertGroup[]
): RouteMatchingCounts {
  const counts: RouteMatchingCounts = new Map();
  if (!routeTree || alertGroups.length === 0) {
    return counts;
  }

  const compiledTree = compileRoute(routeTree);
  const seenFingerprints = new Set<string>();

  for (const group of alertGroups) {
    for (const alert of group.alerts) {
      if (seenFingerprints.has(alert.fingerprint)) {
        continue;
      }
      seenFingerprints.add(alert.fingerprint);
      countMatches(compiledTree, alert.labels, counts);
    }
  }

  return counts;
}

/** Get a route's match count, defaulting to zero. */
export function getRouteMatchCount(counts: RouteMatchingCounts, routeId: string): number {
  return counts.get(routeId) ?? 0;
}
