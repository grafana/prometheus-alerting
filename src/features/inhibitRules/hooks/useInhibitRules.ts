import { alertmanagerApi } from '../../../api/alertmanager/vanilla.endpoints';
import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch and manage inhibit rules from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 * Dynamically selects the correct API endpoint based on the data source implementation.
 *
 * Inhibit rules allow you to mute alerts based on the presence of other alerts.
 * For example, you can inhibit alerts about a service when an alert about the host is firing.
 *
 * This hook can be extended in the future to support:
 * - Creating new inhibit rules
 * - Editing existing inhibit rules
 * - Deleting inhibit rules
 */
export function useInhibitRules() {
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
    inhibitRules: queryResult.data?.alertmanager_config?.inhibit_rules ?? [],
  };
}
