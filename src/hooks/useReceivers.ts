import { useAlertmanagerApi } from './useAlertmanagerApi';

/**
 * Hook to fetch and manage receivers from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes receivers.
 *
 * This hook can be extended in the future to support:
 * - Creating new receivers
 * - Editing existing receivers
 * - Deleting receivers
 */
export function useListReceivers() {
  const api = useAlertmanagerApi();

  return api.endpoints.getStatus.useQuery(undefined, {
    selectFromResult: (result) => ({
      ...result,
      receivers: result.data?.config.parsed?.receivers ?? [],
    }),
  });
}
