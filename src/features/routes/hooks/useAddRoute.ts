import { useCallback, useState } from 'react';

import { AppEvents } from '@grafana/data';
import { addRouteToReferenceRoute, cleanRouteIDs } from '@grafana/external-alertmanager/mimir';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { extractErrorMessage } from '../../../utils/errors';
import { FormAmRoute, InsertPosition } from '../types';
import { formAmRouteToAmRoute } from '../utils/routeTransform';
import { addUniqueIdentifier } from '../utils';
import { useRoutes } from './useRoutes';

interface UseAddRouteResult {
  /** Adds a new route. Returns true on success, false on failure. */
  addRoute: (referenceRouteId: string, newRoute: Partial<FormAmRoute>, position: InsertPosition) => Promise<boolean>;
  isAdding: boolean;
  error: Error | null;
}

/**
 * Hook for adding a new route to the routing tree.
 *
 * This hook:
 * 1. Fetches the current Alertmanager configuration
 * 2. Adds the new route to the tree at the specified position
 * 3. Saves the updated configuration back to Alertmanager
 */
export function useAddRoute(): UseAddRouteResult {
  const { uid: dataSourceUID } = useAlertmanager();
  const { refetch: refetchRoutes } = useRoutes();

  const [getUserConfiguration] = mimirAlertmanagerApi.endpoints.getUserConfiguration.useLazyQuery();
  const [updateUserConfiguration] = mimirAlertmanagerApi.endpoints.updateUserConfiguration.useMutation();

  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addRoute = useCallback(
    async (referenceRouteId: string, newRoute: Partial<FormAmRoute>, position: InsertPosition): Promise<boolean> => {
      setIsAdding(true);
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

        // 2. Add deterministic IDs to the fetched tree (matching UI IDs)
        const currentRouteTree = currentConfig.alertmanager_config.route as Route;
        const routeTreeWithIds = addUniqueIdentifier(currentRouteTree);

        // 3. Add the new route to the tree
        const routeToAdd = formAmRouteToAmRoute(newRoute);
        const updatedRouteTree = addRouteToReferenceRoute(routeToAdd, routeTreeWithIds, position, referenceRouteId);

        // 4. Strip IDs before saving (Alertmanager doesn't need them)
        const cleanRouteTree = cleanRouteIDs(updatedRouteTree);

        // 5. Build the updated configuration
        const updatedConfig = {
          ...currentConfig,
          alertmanager_config: {
            ...currentConfig.alertmanager_config,
            route: cleanRouteTree,
          },
        };

        // 6. Save the updated configuration
        await updateUserConfiguration({
          dataSourceUID,
          configuration: updatedConfig,
        }).unwrap();

        // 7. Refetch routes to update the UI
        refetchRoutes();

        // Show success notification
        getAppEvents().publish({
          type: AppEvents.alertSuccess.name,
          payload: [t('routes.add.success', 'Successfully added route')],
        });

        return true;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        const error = new Error(errorMessage);
        setError(error);

        getAppEvents().publish({
          type: AppEvents.alertError.name,
          payload: [t('routes.add.error', 'Failed to add route'), errorMessage],
        });

        return false;
      } finally {
        setIsAdding(false);
      }
    },
    [dataSourceUID, getUserConfiguration, updateUserConfiguration, refetchRoutes]
  );

  return {
    addRoute,
    isAdding,
    error,
  };
}
