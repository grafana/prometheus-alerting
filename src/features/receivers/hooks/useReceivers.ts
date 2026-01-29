import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useCallback } from 'react';
import { useAlertmanager } from '../../../hooks/useAlertmanager';

/**
 * Hook to fetch and manage receivers from the Alertmanager configuration.
 * Uses the getConfiguration endpoint which returns ParsedUserConfiguration.
 * Dynamically selects the correct API endpoint based on the data source implementation.
 *
 * This hook can be extended in the future to support:
 * - Creating new receivers
 * - Editing existing receivers
 * - Deleting receivers
 */
export function useReceivers() {
  const { uid: dataSourceUID, settings } = useAlertmanager();
  const implementation = settings.jsonData?.implementation ?? 'prometheus';

  // Select the appropriate API endpoint based on implementation
  // Mimir uses getUserConfiguration, vanilla Alertmanager uses getConfiguration
  const [mimirTrigger, mimirResult] = mimirAlertmanagerApi.endpoints.getUserConfiguration.useLazyQuery();
  const [vanillaTrigger, vanillaResult] = alertmanagerApi.endpoints.getConfiguration.useLazyQuery();

  const trigger = implementation === 'mimir' ? mimirTrigger : vanillaTrigger;
  const result = implementation === 'mimir' ? mimirResult : vanillaResult;

  // memoize the trigger function so we avoid an infinite loop
  const triggerFn = useCallback(() => {
    trigger({ dataSourceUID });
  }, [dataSourceUID, trigger]);

  return [
    triggerFn,
    {
      ...result,
      receivers: result.data?.alertmanager_config?.receivers,
    },
  ] as const;
}
