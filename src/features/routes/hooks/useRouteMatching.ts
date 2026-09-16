import { useMemo } from 'react';

import type { RouteWithID } from '@grafana/external-alertmanager/mimir';
import type { AlertGroup } from '@grafana/external-alertmanager/vanilla';
import { countRouteMatches, type RouteMatchingCounts } from '../utils/routeMatching';

/** Compute the number of unique alert instances delivered to each route. */
export function useRouteMatching(routeTree: RouteWithID | undefined, alertGroups: AlertGroup[]): RouteMatchingCounts {
  return useMemo(() => countRouteMatches(routeTree, alertGroups), [routeTree, alertGroups]);
}
