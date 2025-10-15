import { alertmanagerApi } from '../../../api/alertmanager.endpoints';
import { useCallback } from 'react';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch and manage receivers from the Alertmanager status endpoint.
 * The status endpoint contains the full Alertmanager config which includes receivers.
 *
 * This hook can be extended in the future to support:
 * - Creating new receivers
 * - Editing existing receivers
 * - Deleting receivers
 */
export function useReceivers() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  const [trigger, result] = alertmanagerApi.endpoints.getStatus.useLazyQuery({
    selectFromResult: (result) => ({
      ...result,
      receivers: result.data?.config.parsed?.receivers ?? [],
    }),
  });

  // memoize the trigger function so we avoid an infinite loop
  const triggerFn = useCallback(() => {
    trigger({ dataSourceUID, implementation });
  }, [dataSourceUID, implementation, trigger]);

  return [triggerFn, result] as const;
}
