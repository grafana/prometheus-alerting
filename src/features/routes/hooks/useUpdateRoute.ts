import { useCallback, useState } from 'react';

import { AppEvents } from '@grafana/data';
import { Route } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

import { mimirAlertmanagerApi } from '../../../api/alertmanager/mimir.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { FormAmRoute } from '../types';
import { mergeRouteIntoTree } from '../utils/routeTransform';
import { useRoutes } from './useRoutes';

/**
 * Extract a human-readable error message from various error formats.
 * RTK Query errors can be objects with nested data/message properties.
 */
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }
  
  if (typeof err === 'string') {
    return err;
  }
  
  if (typeof err === 'object' && err !== null) {
    // RTK Query error format: { data: { message: "..." } } or { data: "..." }
    const errorObj = err as Record<string, unknown>;
    
    if (errorObj.data) {
      if (typeof errorObj.data === 'string') {
        return errorObj.data;
      }
      if (typeof errorObj.data === 'object' && errorObj.data !== null) {
        const dataObj = errorObj.data as Record<string, unknown>;
        if (typeof dataObj.message === 'string') {
          return dataObj.message;
        }
        if (typeof dataObj.error === 'string') {
          return dataObj.error;
        }
      }
    }
    
    // Direct message property
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    
    // Try JSON stringifying as last resort
    try {
      return JSON.stringify(err);
    } catch {
      return 'An unknown error occurred';
    }
  }
  
  return 'An unknown error occurred';
}

interface UseUpdateRouteResult {
  /** Updates a route. Returns true on success, false on failure. */
  updateRoute: (routeId: string, update: Partial<FormAmRoute>) => Promise<boolean>;
  isUpdating: boolean;
  error: Error | null;
}

/**
 * Hook for updating a notification policy route.
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

        // 2. Merge the updated route into the tree
        const currentRouteTree = currentConfig.alertmanager_config.route as Route;
        const updatedRouteTree = mergeRouteIntoTree(currentRouteTree, routeId, update);

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
          payload: [t('routes.update.success', 'Successfully updated notification policy')],
        });

        return true;
      } catch (err) {
        // Extract error message from various error formats
        const errorMessage = extractErrorMessage(err);
        const error = new Error(errorMessage);
        setError(error);
        
        getAppEvents().publish({
          type: AppEvents.alertError.name,
          payload: [t('routes.update.error', 'Failed to update notification policy'), errorMessage],
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
