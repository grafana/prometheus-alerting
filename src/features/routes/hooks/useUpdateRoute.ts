import { useCallback } from 'react';

import { RouteWithID } from '@grafana/external-alertmanager/mimir';
import { t } from '@grafana/i18n';

import { isAbilityAllowed } from '../../../access-control/abilities';
import { RouteAction } from '../../../access-control/abilities.routes';
import { useAppNotifications } from '../../../hooks/useAppNotifications';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { updateRouteAction } from '../../../reducers/alertmanager/routes';
import { FormAmRoute } from '../types';
import { formAmRouteToAmRoute } from '../utils/routeTransform';
import { getRouteAbilityErrorFeedback, getRouteMutationErrorFeedback } from '../utils/errorFeedback';
import { useRouteAbilities } from './useRouteAbilities';
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
  const updateAbility = useRouteAbilities()[RouteAction.UpdateRoute];
  const { error: notifyError, success: notifySuccess } = useAppNotifications();

  const updateRoute = useCallback(
    async (routeId: string, update: Partial<FormAmRoute>) => {
      if (!isAbilityAllowed(updateAbility)) {
        const feedback = getRouteAbilityErrorFeedback(updateAbility);
        notifyError(feedback.title, feedback.description);
        return false;
      }

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
    [notifyError, notifySuccess, produceNewAlertmanagerConfiguration, refetchRoutes, updateAbility]
  );

  return {
    updateRoute,
    isUpdating: isLoading,
  };
}
