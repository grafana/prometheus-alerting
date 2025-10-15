import { alertmanagerApi } from "../../api/mimir.endpoints";
import { useAppSelector } from "../../store/hooks";
import { selectDataSourceUID } from "../../store/datasourceSlice";

/**
 * Hook to fetch and manage routes from the Mimir Alertmanager configuration endpoint.
 * The configuration endpoint contains the full Alertmanager config which includes the routing tree.
 *
 * This hook can be extended in the future to support:
 * - Creating new routes
 * - Editing existing routes
 * - Deleting routes
 */
export function useRoutes() {
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  return alertmanagerApi.endpoints.getConfiguration.useQuery({ dataSourceUID }, {
    selectFromResult: (result) => ({
      ...result,
      route: result.data?.alertmanager_config.route,
    }),
  });
}
