import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';

/**
 * Adds deterministic IDs to a route tree based on position.
 * IDs are stable across re-fetches as long as the tree structure doesn't change.
 *
 * Example IDs:
 * - Root: "0"
 * - First child: "0.0"
 * - Second child: "0.1"
 * - First grandchild of first child: "0.0.0"
 */
export function addUniqueIdentifier(route: Route, parentId = '0'): RouteWithID {
  return {
    id: parentId,
    ...route,
    routes: route.routes?.map((child, index) => addUniqueIdentifier(child, `${parentId}.${index}`)) ?? [],
  };
}

/** Find a route by its `addUniqueIdentifier`-assigned id within a route tree. */
export function findRouteById(route: RouteWithID, id: string): RouteWithID | undefined {
  if (route.id === id) {
    return route;
  }
  for (const child of route.routes ?? []) {
    const found = findRouteById(child as RouteWithID, id);
    if (found) {
      return found;
    }
  }
  return undefined;
}
