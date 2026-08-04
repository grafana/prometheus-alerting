import { Ability, AlertingPermission, makeAbility } from './abilities';

/** Returns whether the selected Alertmanager configuration can be mutated. */
export function getAlertmanagerConfigMutationAbility(hasConfigurationAPI: boolean): Ability {
  return makeAbility({
    permission: AlertingPermission.NotificationsWrite,
    supported: hasConfigurationAPI,
  });
}
