import { useCallback, useMemo } from 'react';

import { findTimeIntervalUses, type TimeIntervalUse } from '@grafana/external-alertmanager/vanilla';
import { useRoutes } from '../../routes/hooks/useRoutes';
import { attachRouteIds } from '../../routes/utils';

/**
 * Looks up which routes use a time interval. The route tree comes from the same request the
 * routes page makes, so this shares its cached response instead of fetching again.
 *
 * `getUses` returns nothing until the routes have loaded; check `isSuccess` before treating an
 * empty result as "no route uses it". When the request fails, `isError` is set and `error` says why.
 */
export function useTimeIntervalUses() {
  const { route, isSuccess, isError, error } = useRoutes();

  // The IDs have to be attached the same way the routes page does it, so links open the right route
  const routeWithIds = useMemo(() => (route ? attachRouteIds(route) : undefined), [route]);

  const getUses = useCallback(
    (timeInterval: string): TimeIntervalUse[] => (routeWithIds ? findTimeIntervalUses(timeInterval, routeWithIds) : []),
    [routeWithIds]
  );

  // A configuration without a routing tree has loaded fine, there just isn't a route to use anything
  return { getUses, isSuccess, isError, error };
}
