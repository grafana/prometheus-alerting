import { Ability } from '../access-control/abilities';
import { getAlertmanagerConfigMutationAbility } from '../access-control/abilities.alertmanager';
import { useHasConfigurationAPI } from './useHasConfigurationAPI';

/** Returns whether configuration mutations are available for the selected Alertmanager and current user. */
export function useAlertmanagerConfigMutationAbility(): Ability {
  return getAlertmanagerConfigMutationAbility(useHasConfigurationAPI());
}
