import { useCallback } from 'react';

import { t } from '@grafana/i18n';

import { isAbilityAllowed } from '../../../access-control/abilities';
import { RouteAction } from '../../../access-control/abilities.routes';
import { useAppNotifications } from '../../../hooks/useAppNotifications';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { addRouteAction } from '../../../reducers/alertmanager/routes';
import { FormAmRoute, InsertPosition } from '../types';
import { formAmRouteToAmRoute } from '../utils/routeTransform';
import { getRouteAbilityErrorFeedback, getRouteMutationErrorFeedback } from '../utils/errorFeedback';
import { useRouteAbilities } from './useRouteAbilities';
import { useRoutes } from './useRoutes';

interface UseAddRouteResult {
  /** Adds a new route. Returns true on success, false on failure. */
  addRoute: (referenceRouteId: string, newRoute: Partial<FormAmRoute>, position: InsertPosition) => Promise<boolean>;
  isAdding: boolean;
}

/**
 * Hook for adding a new route to the routing tree.
 */
export function useAddRoute(): UseAddRouteResult {
  const { refetch: refetchRoutes } = useRoutes();
  const [produceNewAlertmanagerConfiguration, { isLoading }] = useProduceNewAlertmanagerConfiguration();
  const createAbility = useRouteAbilities()[RouteAction.CreateRoute];
  const { error: notifyError, success: notifySuccess } = useAppNotifications();

  const addRoute = useCallback(
    async (referenceRouteId: string, newRoute: Partial<FormAmRoute>, position: InsertPosition): Promise<boolean> => {
      if (!isAbilityAllowed(createAbility)) {
        const feedback = getRouteAbilityErrorFeedback(createAbility);
        notifyError(feedback.title, feedback.description);
        return false;
      }

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

        notifySuccess(t('routes.add.success', 'Successfully added route'));

        return true;
      } catch (err) {
        const feedback = getRouteMutationErrorFeedback(err, t('routes.add.error', 'Failed to add route'));
        notifyError(feedback.title, feedback.description);

        return false;
      }
    },
    [createAbility, notifyError, notifySuccess, produceNewAlertmanagerConfiguration, refetchRoutes]
  );

  return {
    addRoute,
    isAdding: isLoading,
  };
}
