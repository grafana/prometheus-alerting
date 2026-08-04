import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch alert groups from the configured Alertmanager.
 * Alert groups contain the actual alert instances currently being processed.
 */
export function useAlertGroups({ skip = false }: { skip?: boolean } = {}) {
  const { uid: dataSourceUID } = useAlertmanager();

  const { data, isLoading, error, refetch } = alertmanagerApi.endpoints.getAlertGroups.useQuery(
    {
      dataSourceUID,
      // Fetch all alert states
      active: true,
      silenced: true,
      inhibited: true,
    },
    { skip }
  );

  return {
    alertGroups: data ?? [],
    isLoading,
    error,
    refetch,
  };
}
