import { alertmanagerApi } from "../../api/alertmanager.endpoints"
import { useAppSelector } from "../../store/hooks";
import { selectDataSourceUID } from "../../store/datasourceSlice";

/**
 * Hook to fetch and manage time intervals from the Prometheus Alertmanager status endpoint.
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
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  return alertmanagerApi.endpoints.getStatus.useQuery({ dataSourceUID }, {
    selectFromResult: (result) => ({
      ...result,
      timeIntervals: result.data?.config.parsed?.time_intervals ?? [],
    }),
  });
}
