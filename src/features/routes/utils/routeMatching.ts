import { parseFlags } from '@grafana/data';
import type { RouteWithID as AlertmanagerRouteWithID } from '@grafana/external-alertmanager/mimir';
import { normalizeMatchers, type AlertGroup, type ObjectMatcher } from '@grafana/external-alertmanager/vanilla';

export type RouteMatchingCounts = Map<string, number>;

type CompiledMatcher = {
  label: string;
  // Matchers for the same label share a slot in the per-alert cache.
  labelIndex: number;
  value: string;
  regex: RegExp | null;
  negate: boolean;
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

function compileRoute(route: AlertmanagerRouteWithID, labelIndices: Map<string, number>): CompiledRoute {
  const invalidMatchers: InvalidMatcher[] = [];
  const matchers = normalizeMatchers(route).map((matcher) => compileMatcher(matcher, invalidMatchers, labelIndices));
  const routes = route.routes?.map((child) => compileRoute(child, labelIndices)) ?? [];

  return {
    continue: route.continue ?? false,
    id: route.id,
    ...(invalidMatchers.length > 0 ? { invalidMatchers } : {}),
    matchers,
    routes,
  };
}

function compileMatcher(
  [label, operator, value]: ObjectMatcher,
  invalidMatchers: InvalidMatcher[],
  labelIndices: Map<string, number>
): CompiledMatcher {
  let labelIndex = labelIndices.get(label);
  if (labelIndex === undefined) {
    labelIndex = labelIndices.size;
    labelIndices.set(label, labelIndex);
  }
  if (operator === '=' || operator === '!=') {
    return { label, labelIndex, value, regex: null, negate: operator === '!=' };
  }

  try {
    const { cleaned, flags } = parseFlags(`^(?:${value})$`);
    const regex = new RegExp(cleaned, flags);
    return { label, labelIndex, value, regex, negate: operator === '!~' };
  } catch (error) {
    invalidMatchers.push({ error, label });
    // Invalid matchers are always false, including !~, unless diagnostics below throw.
    return { label, labelIndex, value, regex: /(?!)/, negate: false };
  }
}

function routeMatches(route: CompiledRoute, labels: Record<string, string>, cachedLabelValues: string[]): boolean {
  let allMatchersMatch = true;
  for (const matcher of route.matchers) {
    // Read each label at most once for this alert, even if many siblings test it.
    let value = cachedLabelValues[matcher.labelIndex];
    if (value === undefined) {
      value = labels[matcher.label] || '';
      cachedLabelValues[matcher.labelIndex] = value;
    }
    let matched: boolean;
    if (matcher.regex) {
      // Global regexes retain state between calls; each alert needs a fresh match.
      matcher.regex.lastIndex = 0;
      matched = matcher.regex.test(value);
    } else {
      matched = value === matcher.value;
    }
    if (matcher.negate) {
      matched = !matched;
    }
    if (!matched) {
      allMatchersMatch = false;
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

  return allMatchersMatch;
}

// The caller has already checked this route's matchers.
function countMatchingRoute(
  route: CompiledRoute,
  labels: Record<string, string>,
  counts: RouteMatchingCounts,
  cachedLabelValues: string[]
): void {
  let hasMatchingChild = false;
  for (const child of route.routes) {
    if (!routeMatches(child, labels, cachedLabelValues)) {
      continue;
    }
    countMatchingRoute(child, labels, counts, cachedLabelValues);
    hasMatchingChild = true;
    if (!child.continue) {
      break;
    }
  }
  // A matching parent is a destination only when none of its children match.
  if (!hasMatchingChild) {
    counts.set(route.id, (counts.get(route.id) ?? 0) + 1);
  }
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

  const compiledTree = compileRoute(routeTree, new Map());
  const seenFingerprints = new Set<string>();

  for (const group of alertGroups) {
    for (const alert of group.alerts) {
      if (seenFingerprints.has(alert.fingerprint)) {
        continue;
      }
      seenFingerprints.add(alert.fingerprint);
      const cachedLabelValues: string[] = [];
      if (routeMatches(compiledTree, alert.labels, cachedLabelValues)) {
        countMatchingRoute(compiledTree, alert.labels, counts, cachedLabelValues);
      }
    }
  }

  return counts;
}

/** Get a route's match count, defaulting to zero. */
export function getRouteMatchCount(counts: RouteMatchingCounts, routeId: string): number {
  return counts.get(routeId) ?? 0;
}
