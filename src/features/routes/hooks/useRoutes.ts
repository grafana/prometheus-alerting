import { alertmanagerApi } from '../../../api/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch and manage routes from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 *
 * This hook can be extended in the future to support:
 * - Creating new routes
 * - Editing existing routes
 * - Deleting routes
 */
export function useRoutes() {
  const { uid: dataSourceUID } = useAlertmanager();

  return alertmanagerApi.endpoints.getConfiguration.useQuery(
    { dataSourceUID },
    {
      selectFromResult: (result) => ({
        ...result,
        route: result.data?.alertmanager_config?.route,
      }),
    }
  );
}
