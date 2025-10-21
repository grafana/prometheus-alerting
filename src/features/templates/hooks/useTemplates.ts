import { alertmanagerApi } from '../../../api/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch and manage templates from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 *
 * This hook can be extended in the future to support:
 * - Creating new templates
 * - Editing existing templates
 * - Deleting templates
 */
export function useTemplates() {
  const { uid: dataSourceUID } = useAlertmanager();

  return alertmanagerApi.endpoints.getConfiguration.useQuery(
    { dataSourceUID },
    {
      selectFromResult: (result) => ({
        ...result,
        templates: result.data?.alertmanager_config?.templates ?? [],
      }),
    }
  );
}
