import { getRoutesAbilities, RouteAbilities } from '../../../access-control/abilities.routes';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';

/**
 * Returns the actions available for the selected Alertmanager.
 *
 * Route reads only require Grafana permissions. Route mutations additionally
 * require an Alertmanager implementation with a configuration API.
 */
export function useRouteAbilities(): RouteAbilities {
  return getRoutesAbilities(useHasConfigurationAPI());
}
