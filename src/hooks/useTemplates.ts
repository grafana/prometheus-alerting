import { alertmanagerApi } from '../api/alertmanager.endpoints';
import { useAlertmanager } from './useAlertmanager';

/**
 * Hook to fetch and manage templates from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes templates.
 *
 * This hook can be extended in the future to support:
 * - Creating new templates
 * - Editing existing templates
 * - Deleting templates
 */
export function useTemplates() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  return alertmanagerApi.endpoints.getStatus.useQuery(
    { dataSourceUID, implementation },
    {
      selectFromResult: (result) => ({
        ...result,
        templates: result.data?.config.parsed?.templates ?? [],
      }),
    }
  );
}
