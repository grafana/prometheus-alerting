import { QueryStatus } from '@reduxjs/toolkit/query';

import { featureDiscoveryApi } from '../../../../api/rules/featureDiscovery.endpoints';
import { prometheusApi } from '../../../../api/rules/prometheus.endpoints';
import { useAppSelector } from '../../../../store/hooks';
import type { RootState } from '../../../../store/store';

/**
 * Whether any request the rule list waits on is still running: feature discovery for a data source,
 * or a page of its rule groups. Both go through RTK Query, so its own request state tells us – no
 * need for every loader to report when it starts and stops.
 */
export function selectIsLoadingRules(state: RootState): boolean {
  const discovering = Object.values(state[featureDiscoveryApi.reducerPath].queries).some(
    (query) => query?.status === QueryStatus.pending
  );
  const loadingGroups = Object.values(state[prometheusApi.reducerPath].queries).some(
    (query) => query?.endpointName === 'getGroups' && query.status === QueryStatus.pending
  );

  return discovering || loadingGroups;
}

export function useIsLoadingRules(): boolean {
  return useAppSelector(selectIsLoadingRules);
}
