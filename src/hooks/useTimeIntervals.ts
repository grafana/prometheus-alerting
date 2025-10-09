import { useAlertmanagerApi } from './useAlertmanagerApi';

/**
 * Hook to fetch and manage time intervals from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes time intervals.
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
  const api = useAlertmanagerApi();

  return api.endpoints.getStatus.useQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      timeIntervals: result.data?.config.parsed?.time_intervals ?? [],
    }),
  });
}
