import { alertmanagerApi } from "../api/alertmanager.endpoints";

/**
 * Hook to fetch and manage routes from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes the routing tree.
 *
 * This hook can be extended in the future to support:
 * - Creating new routes
 * - Editing existing routes
 * - Deleting routes
 */
export function useRoutes() {
  return alertmanagerApi.endpoints.getStatus.useQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      route: result.data?.config.parsed?.route,
    }),
  });
}
