import { useCallback, useState } from 'react';

import { AppEvents } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteRouteAction } from '../../../reducers/alertmanager/routes';
import { extractErrorMessage } from '../../../utils/errors';
import { useRoutes } from './useRoutes';

interface UseDeleteRouteResult {
  /** Deletes a route. Returns true on success, false on failure. */
  deleteRoute: (routeId: string) => Promise<boolean>;
  isDeleting: boolean;
  error: Error | null;
}

/**
 * Hook for deleting a route (and all its sub-routes) from the routing tree.
 */
export function useDeleteRoute(): UseDeleteRouteResult {
  const { refetch: refetchRoutes } = useRoutes();
  const [produceNewAlertmanagerConfiguration, { isLoading }] = useProduceNewAlertmanagerConfiguration();

  const [error, setError] = useState<Error | null>(null);

  const deleteRoute = useCallback(
    async (routeId: string) => {
      setError(null);

      try {
        await produceNewAlertmanagerConfiguration(deleteRouteAction({ id: routeId }));

        refetchRoutes();

        getAppEvents().publish({
          type: AppEvents.alertSuccess.name,
          payload: [t('routes.delete.success', 'Successfully deleted route')],
        });

        return true;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        const error = new Error(errorMessage);
        setError(error);

        getAppEvents().publish({
          type: AppEvents.alertError.name,
          payload: [t('routes.delete.error', 'Failed to delete route'), errorMessage],
        });

        return false;
      }
    },
    [produceNewAlertmanagerConfiguration, refetchRoutes]
  );

  return {
    deleteRoute,
    isDeleting: isLoading,
    error,
  };
}
