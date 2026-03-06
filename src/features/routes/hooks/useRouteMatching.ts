import { useMemo } from 'react';

import { findMatchingRoutes, RouteWithID } from '@grafana/alerting';
import { AlertGroup } from '@grafana/external-alertmanager/vanilla';

/**
 * A map from route ID to the number of alert instances that match that route.
 */
export type RouteMatchingCounts = Map<string, number>;

/**
 * Hook that computes how many alert instances match each route in the routing tree.
 *
 * This performs a matching algorithm similar to Alertmanager's own routing logic:
 * - For each alert instance, traverse the route tree depth-first
 * - Find which routes match the alert's labels
 * - Count how many alerts end up at each route
 *
 * @param routeTree - The full routing tree with unique IDs
 * @param alertGroups - Alert groups from the Alertmanager API
 * @returns A map from route ID to count of matching instances
 */
export function useRouteMatching(routeTree: RouteWithID | undefined, alertGroups: AlertGroup[]): RouteMatchingCounts {
  return useMemo(() => {
    const counts: RouteMatchingCounts = new Map();

    if (!routeTree || !alertGroups.length) {
      return counts;
    }

    // Flatten all alerts from all groups into a list of label sets
    for (const group of alertGroups) {
      for (const alert of group.alerts) {
        // Convert alert labels to the format expected by findMatchingRoutes
        const labels = Object.entries(alert.labels);

        // Find which routes match this alert
        const matchingRoutes = findMatchingRoutes(routeTree, labels);

        // Increment the count for each matched route
        for (const match of matchingRoutes) {
          const routeId = match.route.id;
          if (routeId) {
            counts.set(routeId, (counts.get(routeId) ?? 0) + 1);
          }
        }
      }
    }

    return counts;
  }, [routeTree, alertGroups]);
}

/**
 * Get the count for a specific route, defaulting to 0 if not found.
 */
export function getRouteMatchCount(counts: RouteMatchingCounts, routeId: string | undefined): number {
  if (!routeId) {
    return 0;
  }
  return counts.get(routeId) ?? 0;
}
