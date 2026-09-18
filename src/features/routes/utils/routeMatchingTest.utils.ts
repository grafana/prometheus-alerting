import { matchAlertsToRoutes, type AlertGroup, type RouteWithID } from '@grafana/external-alertmanager/vanilla';

import { countRouteMatches as countMatchedAlerts } from '../hooks/useRouteMatching';

/** Exercise the complete production matching-and-counting path in tests and benchmarks. */
export function countRouteMatches(routeTree: RouteWithID | undefined, alertGroups: AlertGroup[]): Map<string, number> {
  return countMatchedAlerts(matchAlertsToRoutes(routeTree, alertGroups));
}
