import { Route } from '@grafana/external-alertmanager/vanilla';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';

/**
 * A `RouteWithID` whose `routes` are recursively `RouteWithID` too. The upstream
 * `@grafana/external-alertmanager` `RouteWithID` only narrows the top-level node — `routes`
 * stays typed as the base `Route[]` — even though every node in a tree built by
 * `addUniqueIdentifier` has an id. Assignable to `RouteWithID` anywhere one is expected.
 *
 * TODO: fix this at the source instead — `packages/alertmanager/src/vanilla/api/types/common.ts`'s
 * `RoutesSchema` declares `routes: z.array(z.any())`, so `Route.routes` (and everything built on
 * top of it) is really `any[]`. The proper fix is a recursive Zod schema (hand-written `Route`
 * interface + `RoutesSchema: z.ZodType<Route>` + `routes: z.array(z.lazy(() => RoutesSchema))`),
 * but that also requires fixing 5 pre-existing `as RouteWithID` casts inside
 * `packages/alertmanager/src/mimir/routes.utils.ts` that currently only compile because `routes`
 * is `any[]`, plus an `alertmanager_config.route` typing mismatch in the RTK Query layer — a
 * separate PR, not bundled here to keep this one small.
 */
export type RouteTreeWithID = RouteWithID & { routes?: RouteTreeWithID[] };

/**
 * Build a child route's positional id from its parent's id and its index among siblings. This is
 * the single source of truth for the scheme — `addUniqueIdentifier` (below) and the tree-walking
 * functions in `routeTransform.ts` (which reconstruct ids over a fetched tree that has none) must
 * agree on it exactly, or a route lookup silently fails to match.
 */
export function buildRouteId(parentId: string, index: number): string {
  return `${parentId}.${index}`;
}

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
export function addUniqueIdentifier(route: Route, parentId = '0'): RouteTreeWithID {
  return {
    id: parentId,
    ...route,
    routes: route.routes?.map((child, index) => addUniqueIdentifier(child, buildRouteId(parentId, index))) ?? [],
  };
}

/** Find a route by its `addUniqueIdentifier`-assigned id within a route tree. */
export function findRouteById(route: RouteTreeWithID, id: string): RouteTreeWithID | undefined {
  if (route.id === id) {
    return route;
  }
  for (const child of route.routes ?? []) {
    const found = findRouteById(child, id);
    if (found) {
      return found;
    }
  }
  return undefined;
}
