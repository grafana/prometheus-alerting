import { alertmanagerApi } from '../../../api/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import type { PostableSilence } from '@grafana/external-alertmanager/vanilla';

/**
 * Hook to fetch and manage silences from the Alertmanager silences endpoint.
 * Silences are used to mute alerts for a specific time period based on matchers.
 */
export function useSilences(filter?: string[]) {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  return alertmanagerApi.endpoints.getSilences.useQuery({ dataSourceUID, filter, implementation });
}

/**
 * Hook to fetch a single silence by ID
 */
export function useSilence(silenceId: string) {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  return alertmanagerApi.endpoints.getSilence.useQuery({ dataSourceUID, implementation, silenceId });
}

/**
 * Hook to create a new silence.
 * Returns a mutation function and mutation state.
 */
export function useCreateSilence() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  const [postSilence, mutationState] = alertmanagerApi.endpoints.postSilences.useMutation();

  const createSilence = async (postableSilence: PostableSilence) => {
    return postSilence({ dataSourceUID, implementation, postableSilence }).unwrap();
  };

  return [createSilence, mutationState] as const;
}

/**
 * Hook to delete/expire a silence by ID.
 * Returns a mutation function and mutation state.
 */
export function useDeleteSilence() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  const [deleteSilence, mutationState] = alertmanagerApi.endpoints.deleteSilence.useMutation();

  const expireSilence = (silenceId: string) => {
    return deleteSilence({ dataSourceUID, implementation, silenceId });
  };

  return [expireSilence, mutationState] as const;
}
