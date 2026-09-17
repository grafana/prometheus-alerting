import { useMemo } from 'react';

import {
  matchAlertsToRoutes,
  type AlertGroup,
  type RouteMatches,
  type RouteWithID,
} from '@grafana/external-alertmanager/vanilla';

/** How many alert instances landed at each route, keyed by route ID. */
export type RouteMatchingCounts = Map<string, number>;

/** Reduce matched instances to how many landed at each route. */
export function countRouteMatches(matches: RouteMatches): RouteMatchingCounts {
  return new Map(Array.from(matches, ([routeId, alerts]) => [routeId, alerts.length]));
}

/** Get a route's match count, defaulting to zero. */
export function getRouteMatchCount(counts: RouteMatchingCounts, routeId: string): number {
  return counts.get(routeId) ?? 0;
}

/** Work out which alert instances land on each route, and how many that is per route. */
export function useRouteMatching(
  routeTree: RouteWithID | undefined,
  alertGroups: AlertGroup[]
): { matches: RouteMatches; counts: RouteMatchingCounts } {
  return useMemo(() => {
    const matches = matchAlertsToRoutes(routeTree, alertGroups);
    return { matches, counts: countRouteMatches(matches) };
  }, [routeTree, alertGroups]);
}
