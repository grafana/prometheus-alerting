import hashObject from 'object-hash';
import { Route } from './api/types/common';

/** An Alertmanager route with a stable identifier attached, so the UI can track nodes across re-renders. */
export type RouteWithID = Omit<Route, 'routes'> & { id: string; routes?: RouteWithID[] };

/**
 * Recursively adds stable unique identifiers to each route in the route tree.
 * IDs are generated based on position in the tree and content hash to ensure stability.
 *
 * @param route - The route to add IDs to
 * @param position - The position string used to generate unique IDs (default: '0')
 * @returns A route tree with unique IDs added to each route
 */
export function addUniqueIdentifierToRoute(route: Route, position = '0'): RouteWithID {
  const routeHash = hashRoute(route);
  const routes = route.routes ?? [];

  return {
    id: `${position}-${routeHash}`,
    ...route,
    routes: routes.map((route, index) => addUniqueIdentifierToRoute(route, `${position}-${index}`)),
  };
}

/**
 * Generates a stable hash for a route based on its content.
 * Used to create unique identifiers that remain consistent across re-renders.
 *
 * @param route - The route to hash
 * @returns A string hash of the route
 */
export function hashRoute(route: Route): string {
  return hashObject(route);
}

/**
 * A route found in the tree, if there was one. Deliberately the id-less `Route` type: callers
 * insert freshly-created routes that have no id yet, and ids get reattached afterwards.
 */
type FoundRoute = Route | undefined;

/**
 * Recursively searches for a route in the tree by its ID.
 * Returns the matching route, its parent route, and its position within the parent's children.
 *
 * @param routeTree - The root of the route tree to search
 * @param referenceRouteIdentifier - The ID of the route to find
 * @returns A tuple containing [matchingRoute, parentRoute, positionInParent]
 */
export function findRouteInTree(
  routeTree: RouteWithID,
  referenceRouteIdentifier: string
): [matchingRoute: FoundRoute, parentRoute: FoundRoute, positionInParent: number | undefined] {
  let matchingRoute: FoundRoute;
  let matchingRouteParent: FoundRoute;
  let matchingRoutePositionInParent: number | undefined;

  // recurse through the tree to find the matching route, its parent and the position of the route in the parent
  function findRouteInTree(currentRoute: RouteWithID, index: number, parentRoute: RouteWithID) {
    if (matchingRoute) {
      return;
    }

    if (currentRoute.id === referenceRouteIdentifier) {
      matchingRoute = currentRoute;
      matchingRouteParent = parentRoute;
      matchingRoutePositionInParent = index;
    }

    if (currentRoute.routes) {
      currentRoute.routes.forEach((route, index) => findRouteInTree(route, index, currentRoute));
    }
  }

  findRouteInTree(routeTree, 0, routeTree);

  return [matchingRoute, matchingRouteParent, matchingRoutePositionInParent];
}

/**
 * Recursively searches for a route in the tree by its ID.
 *
 * @param id - The ID of the route to find
 * @param routeTree - The root of the route tree to search
 * @returns The matching route or undefined if not found
 */
export function findExistingRoute(id: string, routeTree: RouteWithID): RouteWithID | undefined {
  if (routeTree.id === id) {
    return routeTree;
  }

  for (const child of routeTree.routes ?? []) {
    const match = findExistingRoute(id, child);
    if (match) {
      return match;
    }
  }

  return undefined;
}
