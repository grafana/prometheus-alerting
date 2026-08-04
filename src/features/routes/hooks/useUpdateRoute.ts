import { useCallback } from 'react';

import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { t } from '@grafana/i18n';

import { useAppNotifications } from '../../../hooks/useAppNotifications';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { updateRouteAction } from '../../../reducers/alertmanager/routes';
import { FormAmRoute } from '../types';
import { formAmRouteToAmRoute } from '../utils/routeTransform';
import { getRouteMutationErrorFeedback } from '../utils/errorFeedback';
import { useRoutes } from './useRoutes';

interface UseUpdateRouteResult {
  /** Updates a route. Returns true on success, false on failure. */
  updateRoute: (routeId: string, update: Partial<FormAmRoute>) => Promise<boolean>;
  isUpdating: boolean;
}

/**
 * Hook for updating an existing route in the routing tree.
 */
export function useUpdateRoute(): UseUpdateRouteResult {
  const { refetch: refetchRoutes } = useRoutes();
  const [produceNewAlertmanagerConfiguration, { isLoading }] = useProduceNewAlertmanagerConfiguration();
  const { error: notifyError, success: notifySuccess } = useAppNotifications();

  const updateRoute = useCallback(
    async (routeId: string, update: Partial<FormAmRoute>) => {
      try {
        const partialUpdatedRoute: Partial<RouteWithID> = { ...formAmRouteToAmRoute(update), id: routeId };
        await produceNewAlertmanagerConfiguration(updateRouteAction({ update: partialUpdatedRoute }));

        refetchRoutes();

        notifySuccess(t('routes.update.success', 'Successfully updated route'));

        return true;
      } catch (err) {
        const feedback = getRouteMutationErrorFeedback(err, t('routes.update.error', 'Failed to update route'));
        notifyError(feedback.title, feedback.description);

        return false;
      }
    },
    [notifyError, notifySuccess, produceNewAlertmanagerConfiguration, refetchRoutes]
  );

  return {
    updateRoute,
    isUpdating: isLoading,
  };
}
