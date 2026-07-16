import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID, addUniqueIdentifierToRoute } from '@grafana/external-alertmanager/mimir';

/**
 * Recursively defaults fields whose presence/absence would otherwise change the
 * content hash (e.g. `continue`), so IDs stay stable regardless of whether a given
 * fetch/response omits default values.
 */
function normalizeRoute(route: Route): Route {
  return {
    ...route,
    continue: route.continue ?? false,
    routes: route.routes?.map(normalizeRoute),
  };
}

/**
 * Normalizes and attaches deterministic (content-hash) IDs to a route tree. Must be
 * used everywhere a route tree needs IDs — and called before any further processing
 * (e.g. computeInheritedTree) — so hashes stay consistent between the UI's display
 * tree and hooks' freshly-fetched trees.
 */
export function attachRouteIds(route: Route): RouteWithID {
  return addUniqueIdentifierToRoute(normalizeRoute(route));
}
