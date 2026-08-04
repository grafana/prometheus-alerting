import { useCallback } from 'react';

import { prometheusApi } from '../../../api/rules/prometheus.endpoints';
import { useAppDispatch } from '../../../store/hooks';

/**
 * Evict the cached Prometheus rules that the rule list, group and details views read from,
 * for a single data source.
 *
 * Writes go to the Ruler API, and those mutations can only invalidate tags within `rulerApi`.
 * `prometheusApi` is a separate RTK Query instance with no mutations of its own, so nothing
 * evicts its `Rules` tag – without this, views keep rendering rules that have already been
 * deleted or changed.
 *
 * Call this *after* waiting for the write to propagate to the Prometheus API (see
 * `useRuleConsistencyCheck` / `useGroupConsistencyCheck`), otherwise the refetch triggered
 * here just re-caches the pre-write state.
 *
 * @param dataSourceUid - Only queries for this data source are refetched
 */
export function useInvalidatePromRules() {
  const dispatch = useAppDispatch();

  return useCallback(
    (dataSourceUid: string) => {
      dispatch(prometheusApi.util.invalidateTags([{ type: 'Rules', id: dataSourceUid }]));
    },
    [dispatch]
  );
}
