import { useCallback, useState } from 'react';

import { AppEvents } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getAppEvents } from '@grafana/runtime';

import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { addRouteAction } from '../../../reducers/alertmanager/routes';
import { extractErrorMessage } from '../../../utils/errors';
import { FormAmRoute, InsertPosition } from '../types';
import { formAmRouteToAmRoute } from '../utils/routeTransform';
import { useRoutes } from './useRoutes';

interface UseAddRouteResult {
  /** Adds a new route. Returns true on success, false on failure. */
  addRoute: (referenceRouteId: string, newRoute: Partial<FormAmRoute>, position: InsertPosition) => Promise<boolean>;
  isAdding: boolean;
  error: Error | null;
}

/**
 * Hook for adding a new route to the routing tree.
 */
export function useAddRoute(): UseAddRouteResult {
  const { refetch: refetchRoutes } = useRoutes();
  const [produceNewAlertmanagerConfiguration, { isLoading }] = useProduceNewAlertmanagerConfiguration();

  const [error, setError] = useState<Error | null>(null);

  const addRoute = useCallback(
    async (referenceRouteId: string, newRoute: Partial<FormAmRoute>, position: InsertPosition): Promise<boolean> => {
      setError(null);

      try {
        const partialRoute = formAmRouteToAmRoute(newRoute);
        await produceNewAlertmanagerConfiguration(
          addRouteAction({
            partialRoute,
            referenceRouteIdentifier: referenceRouteId,
            insertPosition: position,
          })
        );

        refetchRoutes();

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
      }
    },
    [produceNewAlertmanagerConfiguration, refetchRoutes]
  );

  return {
    addRoute,
    isAdding: isLoading,
    error,
  };
}
