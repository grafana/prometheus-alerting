import { useCallback, useState } from 'react';

import { AppEvents } from '@grafana/data';
import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { updateRouteAction } from '../../../reducers/alertmanager/routes';
import { extractErrorMessage } from '../../../utils/errors';
import { FormAmRoute } from '../types';
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
 */
export function useUpdateRoute(): UseUpdateRouteResult {
  const { refetch: refetchRoutes } = useRoutes();
  const [produceNewAlertmanagerConfiguration, { isLoading }] = useProduceNewAlertmanagerConfiguration();

  const [error, setError] = useState<Error | null>(null);

  const updateRoute = useCallback(
    async (routeId: string, update: Partial<FormAmRoute>) => {
      setError(null);

      try {
        const partialUpdatedRoute: Partial<RouteWithID> = { ...formAmRouteToAmRoute(update), id: routeId };
        await produceNewAlertmanagerConfiguration(updateRouteAction({ update: partialUpdatedRoute }));

        refetchRoutes();

        getAppEvents().publish({
          type: AppEvents.alertSuccess.name,
          payload: [t('routes.update.success', 'Successfully updated route')],
        });

        return true;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        const error = new Error(errorMessage);
        setError(error);

        getAppEvents().publish({
          type: AppEvents.alertError.name,
          payload: [t('routes.update.error', 'Failed to update route'), errorMessage],
        });

        return false;
      }
    },
    [produceNewAlertmanagerConfiguration, refetchRoutes]
  );

  return {
    updateRoute,
    isUpdating: isLoading,
    error,
  };
}
