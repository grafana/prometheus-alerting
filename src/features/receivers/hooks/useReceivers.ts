import { alertmanagerApi } from '../../../api/alertmanager.endpoints';
import { useCallback } from 'react';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch and manage receivers from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 *
 * This hook can be extended in the future to support:
 * - Creating new receivers
 * - Editing existing receivers
 * - Deleting receivers
 */
export function useReceivers() {
  const { uid: dataSourceUID } = useAlertmanager();

  const [trigger, result] = alertmanagerApi.endpoints.getConfiguration.useLazyQuery({
    selectFromResult: (result) => ({
      ...result,
      receivers: result.data?.alertmanager_config?.receivers ?? [],
    }),
  });

  // memoize the trigger function so we avoid an infinite loop
  const triggerFn = useCallback(() => {
    trigger({ dataSourceUID });
  }, [dataSourceUID, trigger]);

  return [triggerFn, result] as const;
}
