import { findMatchingRoutes, type LabelMatcher, type RouteWithID as GrafanaRouteWithID } from '@grafana/alerting';
import type { AlertGroup, GettableAlert } from './api/types/common';
import { normalizeMatchers, type ObjectMatcher } from './matchers.utils';
import type { RouteWithID } from './routes.utils';

/** The alert instances that ended up at each route, keyed by route ID. */
export type RouteMatches = Map<string, GettableAlert[]>;

/**
 * Alertmanager routes store matchers as strings, while findMatchingRoutes expects Grafana LabelMatcher objects.
 * This local recursive type describes the converted tree and works around the upstream recursive type's
 * incompatibility with TypeScript 6.
 */
type MatchingRouteWithID = Omit<GrafanaRouteWithID, 'routes'> & {
  continue: boolean;
  matchers: LabelMatcher[];
  routes: MatchingRouteWithID[];
};

function toMatchingRoute(route: RouteWithID): MatchingRouteWithID {
  return {
    id: route.id,
    continue: route.continue ?? false,
    matchers: normalizeMatchers(route).map(toLabelMatcher),
    routes: route.routes?.map(toMatchingRoute) ?? [],
  };
}

function toLabelMatcher([label, type, value]: ObjectMatcher): LabelMatcher {
  return { label, type, value };
}

/**
 * Work out which alert instances end up at which routes.
 *
 * An instance can appear more than once in the Alertmanager response (the same alert shows up in
 * several groups), so instances are deduplicated by fingerprint and only counted at the first
 * group that carried them. One instance can still land on several routes, because a matching
 * route with `continue: true` lets its siblings match as well.
 */
export function matchAlertsToRoutes(routeTree: RouteWithID | undefined, alertGroups: AlertGroup[]): RouteMatches {
  const matches: RouteMatches = new Map();
  if (!routeTree || alertGroups.length === 0) {
    return matches;
  }

  const matchingTree = toMatchingRoute(routeTree);
  const seenFingerprints = new Set<string>();

  for (const group of alertGroups) {
    for (const alert of group.alerts) {
      if (seenFingerprints.has(alert.fingerprint)) {
        continue;
      }
      seenFingerprints.add(alert.fingerprint);

      for (const match of findMatchingRoutes(matchingTree, Object.entries(alert.labels))) {
        const matched = matches.get(match.route.id);
        if (matched) {
          matched.push(alert);
        } else {
          matches.set(match.route.id, [alert]);
        }
      }
    }
  }

  return matches;
}

/** Get the instances that landed at a route, defaulting to none. */
export function getRouteMatches(matches: RouteMatches, routeId: string): GettableAlert[] {
  return matches.get(routeId) ?? [];
}
