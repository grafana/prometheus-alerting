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
