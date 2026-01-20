import { useCallback, useState } from 'react';

import { AppEvents } from '@grafana/data';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { extractErrorMessage } from '../../../utils/errors';
import { removeRouteFromTree } from '../utils/routeTransform';
import { useRoutes } from './useRoutes';

interface UseDeleteRouteResult {
  /** Deletes a route. Returns true on success, false on failure. */
  deleteRoute: (routeId: string) => Promise<boolean>;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Hook for deleting a route (and all its sub-routes) from the routing tree.
 *
 * This hook:
 * 1. Fetches the current Alertmanager configuration
 * 2. Removes the route from the tree
 * 3. Saves the updated configuration back to Alertmanager
 */
export function useDeleteRoute(): UseDeleteRouteResult {
  const { uid: dataSourceUID } = useAlertmanager();
  const { refetch: refetchRoutes } = useRoutes();

  const [getUserConfiguration] = mimirAlertmanagerApi.endpoints.getUserConfiguration.useLazyQuery();
  const [updateUserConfiguration] = mimirAlertmanagerApi.endpoints.updateUserConfiguration.useMutation();

  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteRoute = useCallback(
    async (routeId: string) => {
      setIsDeleting(true);
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

        // 2. Remove the route from the tree
        const currentRouteTree = currentConfig.alertmanager_config.route as Route;
        const updatedRouteTree = removeRouteFromTree(currentRouteTree, routeId);

        // 3. Build the updated configuration
        const updatedConfig = {
          ...currentConfig,
          alertmanager_config: {
            ...currentConfig.alertmanager_config,
            route: updatedRouteTree,
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
          payload: [t('routes.delete.success', 'Successfully deleted route')],
        });

        return true;
      } catch (err) {
        // Extract error message from various error formats
        const errorMessage = extractErrorMessage(err);
        const error = new Error(errorMessage);
        setError(error);

        getAppEvents().publish({
          type: AppEvents.alertError.name,
          payload: [t('routes.delete.error', 'Failed to delete route'), errorMessage],
        });

        return false;
      } finally {
        setIsDeleting(false);
      }
    },
    [dataSourceUID, getUserConfiguration, updateUserConfiguration, refetchRoutes]
  );

  return {
    deleteRoute,
    isDeleting,
    error,
  };
}
