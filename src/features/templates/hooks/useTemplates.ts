import { alertmanagerApi } from '../../../api/alertmanager.endpoints';
import { mimirAlertmanagerApi } from '../../../api/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch and manage templates from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 * Dynamically selects the correct API endpoint based on the data source implementation.
 *
 * This hook can be extended in the future to support:
 * - Creating new templates
 * - Editing existing templates
 * - Deleting templates
 */
export function useTemplates() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  // Select the appropriate API endpoint based on implementation
  // Mimir uses getUserConfiguration, vanilla Alertmanager uses getConfiguration
  const mimirQueryResult = mimirAlertmanagerApi.endpoints.getUserConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation !== 'mimir',
    }
  );

  const vanillaQueryResult = alertmanagerApi.endpoints.getConfiguration.useQuery(
    { dataSourceUID },
    {
      skip: implementation === 'mimir',
    }
  );

  const queryResult = implementation === 'mimir' ? mimirQueryResult : vanillaQueryResult;

  return {
    ...queryResult,
    templates: queryResult.data?.alertmanager_config?.templates ?? [],
  };
}
