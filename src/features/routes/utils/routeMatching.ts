import { findMatchingRoutes, type LabelMatcher, type RouteWithID as GrafanaRouteWithID } from '@grafana/alerting';
import type { RouteWithID as AlertmanagerRouteWithID } from '@grafana/external-alertmanager/mimir';
import { normalizeMatchers, type AlertGroup, type ObjectMatcher } from '@grafana/external-alertmanager/vanilla';

export type RouteMatchingCounts = Map<string, number>;

/** Convert Alertmanager string matchers to the objects expected by Grafana's matching utilities. */
function toGrafanaRoute(route: AlertmanagerRouteWithID): GrafanaRouteWithID {
  return {
    id: route.id,
    continue: route.continue ?? false,
    matchers: normalizeMatchers(route).map(toLabelMatcher),
    routes: route.routes?.map(toGrafanaRoute) ?? [],
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

  const matchingTree = toGrafanaRoute(routeTree);
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
