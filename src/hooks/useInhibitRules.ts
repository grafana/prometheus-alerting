import { alertmanagerApi } from '../api/alertmanager.endpoints';
import { useAlertmanager } from './useAlertmanager';

/**
 * Hook to fetch and manage inhibit rules from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes inhibit rules.
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

  return alertmanagerApi.endpoints.getStatus.useQuery(
    { dataSourceUID, implementation },
    {
      selectFromResult: (result) => ({
        ...result,
        inhibitRules: result.data?.config.parsed?.inhibit_rules ?? [],
      }),
    }
  );
}
