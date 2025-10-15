import { alertmanagerApi } from "../../api/alertmanager.endpoints";
import { useAppSelector } from "../../store/hooks";
import { selectDataSourceUID } from "../../store/datasourceSlice";

/**
 * Hook to fetch and manage silences from the Prometheus Alertmanager silences endpoint.
 * Silences are used to mute alerts for a specific time period based on matchers.
 *
 * This hook can be extended in the future to support:
 * - Creating new silences
 * - Editing existing silences
 * - Deleting/expiring silences
 */
export function useSilences(filter?: string[]) {
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  return alertmanagerApi.endpoints.getSilences.useQuery({ dataSourceUID, filter });
}
