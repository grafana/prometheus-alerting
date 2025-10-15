import { alertmanagerApi } from "../../api/alertmanager.endpoints";
import { useAppSelector } from "../../store/hooks";
import { selectDataSourceUID } from "../../store/datasourceSlice";

/**
 * Hook to fetch and manage routes from the Prometheus Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes the routing tree.
 *
 * This hook can be extended in the future to support:
 * - Creating new routes
 * - Editing existing routes
 * - Deleting routes
 */
export function useRoutes() {
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  return alertmanagerApi.endpoints.getStatus.useQuery({ dataSourceUID }, {
    selectFromResult: (result) => ({
      ...result,
      route: result.data?.config.parsed?.route,
    }),
  });
}
