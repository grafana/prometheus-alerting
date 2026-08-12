import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { getSilencesAbilities, SilenceAction } from '../../../access-control/abilities.silences';
import { PermissionDeniedError } from '../../../access-control/errors';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import type { PostableSilence } from '@grafana/external-alertmanager/vanilla';

const ERR_INSUFFICIENT_PERMISSIONS = new PermissionDeniedError('Missing permission to change silences');

/**
 * Hook to fetch and manage silences from the Alertmanager silences endpoint.
 * Silences are used to mute alerts for a specific time period based on matchers.
 */
export function useSilences(filter?: string[]) {
  const { uid: dataSourceUID } = useAlertmanager();

  return alertmanagerApi.endpoints.getSilences.useQuery({ dataSourceUID, filter });
}

/**
 * Hook to fetch a single silence by ID
 */
export function useSilence(silenceId: string, options?: { skip?: boolean }) {
  const { uid: dataSourceUID } = useAlertmanager();

  return alertmanagerApi.endpoints.getSilence.useQuery(
    { dataSourceUID, silenceId },
    { skip: options?.skip || !silenceId }
  );
}

/**
 * Hook to create a new silence.
 * Returns a mutation function and mutation state.
 *
 * This is the enforcement boundary for silence creation and updates — callers that hide their
 * affordances still cannot reach the API without `alert.instances.external:write`.
 */
export function useCreateSilence() {
  const { uid: dataSourceUID } = useAlertmanager();
  const canMutateSilences = isAbilityAllowed(getSilencesAbilities()[SilenceAction.MutateSilences]);

  const [postSilence, mutationState] = alertmanagerApi.endpoints.postSilences.useMutation();

  const createSilence = async (postableSilence: PostableSilence) => {
    if (!canMutateSilences) {
      throw ERR_INSUFFICIENT_PERMISSIONS;
    }

    return postSilence({ dataSourceUID, postableSilence }).unwrap();
  };

  return [createSilence, mutationState] as const;
}

/**
 * Hook to delete/expire a silence by ID.
 * Returns a mutation function and mutation state.
 */
export function useDeleteSilence() {
  const { uid: dataSourceUID } = useAlertmanager();
  const canMutateSilences = isAbilityAllowed(getSilencesAbilities()[SilenceAction.MutateSilences]);

  const [deleteSilence, mutationState] = alertmanagerApi.endpoints.deleteSilence.useMutation();

  const expireSilence = async (silenceId: string) => {
    if (!canMutateSilences) {
      throw ERR_INSUFFICIENT_PERMISSIONS;
    }

    return deleteSilence({ dataSourceUID, silenceId }).unwrap();
  };

  return [expireSilence, mutationState] as const;
}
