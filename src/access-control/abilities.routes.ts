import { Ability, AlertingPermission, makeAbility } from './abilities';
import { getAlertmanagerConfigMutationAbility } from './abilities.alertmanager';

export enum RouteAction {
  ViewRoutes = 'view-routes',
  ViewInstances = 'view-route-instances',
  CreateRoute = 'create-route',
  UpdateRoute = 'update-route',
  DeleteRoute = 'delete-route',
}

export type RouteAbilities = Record<RouteAction, Ability>;

/** Maps route permissions and Alertmanager capabilities to route-page abilities. */
export function getRoutesAbilities(hasConfigurationAPI: boolean): RouteAbilities {
  const viewRoutes = makeAbility({
    permission: AlertingPermission.NotificationsRead,
    supported: true,
  });
  const viewInstances = makeAbility({
    permission: AlertingPermission.InstancesRead,
    supported: true,
  });
  const mutateRoutes = getAlertmanagerConfigMutationAbility(hasConfigurationAPI);

  return {
    [RouteAction.ViewRoutes]: viewRoutes,
    [RouteAction.ViewInstances]: viewInstances,
    [RouteAction.CreateRoute]: mutateRoutes,
    [RouteAction.UpdateRoute]: mutateRoutes,
    [RouteAction.DeleteRoute]: mutateRoutes,
  };
}
