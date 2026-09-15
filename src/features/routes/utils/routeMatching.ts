import { findMatchingRoutes, type LabelMatcher, type RouteWithID as GrafanaRouteWithID } from '@grafana/alerting';
import type { RouteWithID as AlertmanagerRouteWithID } from '@grafana/external-alertmanager/mimir';
import { normalizeMatchers, type AlertGroup, type ObjectMatcher } from '@grafana/external-alertmanager/vanilla';

export type RouteMatchingCounts = Map<string, number>;

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

function toMatchingRoute(route: AlertmanagerRouteWithID): MatchingRouteWithID {
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

/** Count unique Alertmanager alert instances at their selected destination routes. */
export function countRouteMatches(
  routeTree: AlertmanagerRouteWithID | undefined,
  alertGroups: AlertGroup[]
): RouteMatchingCounts {
  const counts: RouteMatchingCounts = new Map();
  if (!routeTree || alertGroups.length === 0) {
    return counts;
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
        counts.set(match.route.id, (counts.get(match.route.id) ?? 0) + 1);
      }
    }
  }

  return counts;
}

/** Get a route's match count, defaulting to zero. */
export function getRouteMatchCount(counts: RouteMatchingCounts, routeId: string): number {
  return counts.get(routeId) ?? 0;
}
