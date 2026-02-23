import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch alert groups from the configured Alertmanager.
 * Returns all alert groups regardless of state (active, silenced, inhibited).
 */
export function useAlertGroups() {
  const { uid: dataSourceUID } = useAlertmanager();

  const { data, isLoading, isSuccess, error } = alertmanagerApi.endpoints.getAlertGroups.useQuery({
    dataSourceUID,
    active: true,
    silenced: true,
    inhibited: true,
  }, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  return {
    alertGroups: data ?? [],
    isLoading,
    isSuccess,
    error,
  };
}
