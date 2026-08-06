import { useCallback } from 'react';

import { t } from '@grafana/i18n';

import { useAppNotifications } from '../../../hooks/useAppNotifications';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteRouteAction } from '../../../reducers/alertmanager/routes';
import { getMutationErrorFeedback } from '../../../access-control/mutationErrorFeedback';
import { useRoutes } from './useRoutes';

interface UseDeleteRouteResult {
  /** Deletes a route. Returns true on success, false on failure. */
  deleteRoute: (routeId: string) => Promise<boolean>;
  isDeleting: boolean;
}

/**
 * Hook for deleting a route (and all its sub-routes) from the routing tree.
 */
export function useDeleteRoute(): UseDeleteRouteResult {
  const { refetch: refetchRoutes } = useRoutes();
  const [produceNewAlertmanagerConfiguration, { isLoading }] = useProduceNewAlertmanagerConfiguration();
  const { error: notifyError, success: notifySuccess } = useAppNotifications();

  const deleteRoute = useCallback(
    async (routeId: string) => {
      try {
        await produceNewAlertmanagerConfiguration(deleteRouteAction({ id: routeId }));

        refetchRoutes();

        notifySuccess(t('routes.delete.success', 'Successfully deleted route'));

        return true;
      } catch (err) {
        const feedback = getMutationErrorFeedback(err, {
          fallbackTitle: t('routes.delete.error', 'Failed to delete route'),
          resource: t('routes.resource-label', 'routes'),
        });
        notifyError(feedback.title, feedback.description);

        return false;
      }
    },
    [notifyError, notifySuccess, produceNewAlertmanagerConfiguration, refetchRoutes]
  );

  return {
    deleteRoute,
    isDeleting: isLoading,
  };
}
