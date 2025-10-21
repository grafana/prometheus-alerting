import { alertmanagerApi } from '../../../api/alertmanager.endpoints';
import { mimirAlertmanagerApi } from '../../../api/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch time intervals from Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 * Dynamically selects the correct API endpoint based on the data source implementation.
 *
 * Time intervals are used to define when notifications should be muted or sent.
 * They specify time ranges, weekdays, days of month, months, and years.
 *
 * This hook can be extended in the future to support:
 * - Creating new time intervals
 * - Editing existing time intervals
 * - Deleting time intervals
 */
export function useTimeIntervals() {
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
    timeIntervals: queryResult.data?.alertmanager_config?.time_intervals ?? [],
  };
}

export function useAddTimeInterval() {}
