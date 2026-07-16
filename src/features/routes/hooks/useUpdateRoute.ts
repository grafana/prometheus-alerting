import { useCallback, useState } from 'react';

import { AppEvents } from '@grafana/data';
import { cleanRouteIDs, mergePartialRouteWithRouteTree } from '@grafana/external-alertmanager/mimir';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { extractErrorMessage } from '../../../utils/errors';
import { FormAmRoute } from '../types';
import { attachRouteIds } from '../utils';
import { formAmRouteToAmRoute } from '../utils/routeTransform';
import { useRoutes } from './useRoutes';

interface UseUpdateRouteResult {
  /** Updates a route. Returns true on success, false on failure. */
  updateRoute: (routeId: string, update: Partial<FormAmRoute>) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook for updating an existing route in the routing tree.
 *
 * This hook:
 * 1. Fetches the current Alertmanager configuration
 * 2. Merges the updated route into the route tree
 * 3. Saves the updated configuration back to Alertmanager
 */
export function useUpdateRoute(): UseUpdateRouteResult {
  const { uid: dataSourceUID } = useAlertmanager();
  const { refetch: refetchRoutes } = useRoutes();

  const [getUserConfiguration] = mimirAlertmanagerApi.endpoints.getUserConfiguration.useLazyQuery();
  const [updateUserConfiguration] = mimirAlertmanagerApi.endpoints.updateUserConfiguration.useMutation();

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateRoute = useCallback(
    async (routeId: string, update: Partial<FormAmRoute>) => {
      setIsUpdating(true);
      setError(null);

      try {
        // 1. Fetch current configuration
        const configResult = await getUserConfiguration({ dataSourceUID });

        if (configResult.error) {
          throw new Error('Failed to fetch current configuration');
        }

        const currentConfig = configResult.data;
        if (!currentConfig?.alertmanager_config?.route) {
          throw new Error('No route configuration found');
        }

        // 2. Add deterministic IDs to the fetched tree (matching UI IDs), then merge the update
        const currentRouteTree = currentConfig.alertmanager_config.route as Route;
        const routeTreeWithIds = attachRouteIds(currentRouteTree);

        const partialUpdatedRoute = { ...formAmRouteToAmRoute(update), id: routeId };
        const updatedRouteTree = mergePartialRouteWithRouteTree(partialUpdatedRoute, routeTreeWithIds);

        // 3. Strip IDs before saving (Alertmanager doesn't need them) and build the updated configuration
        const cleanRouteTree = cleanRouteIDs(updatedRouteTree);
        const updatedConfig = {
          ...currentConfig,
          alertmanager_config: {
            ...currentConfig.alertmanager_config,
            route: cleanRouteTree,
          },
        };

        // 4. Save the updated configuration
        await updateUserConfiguration({
          dataSourceUID,
          configuration: updatedConfig,
        }).unwrap();

        // 5. Refetch routes to update the UI
        refetchRoutes();

        // Show success notification
        getAppEvents().publish({
          type: AppEvents.alertSuccess.name,
          payload: [t('routes.update.success', 'Successfully updated route')],
        });

        return true;
      } catch (err) {
        // Extract error message from various error formats
        const errorMessage = extractErrorMessage(err);
        const error = new Error(errorMessage);
        setError(error);

        getAppEvents().publish({
          type: AppEvents.alertError.name,
          payload: [t('routes.update.error', 'Failed to update route'), errorMessage],
        });

        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [dataSourceUID, getUserConfiguration, updateUserConfiguration, refetchRoutes]
  );

  return {
    updateRoute,
    isUpdating,
    error,
  };
}
