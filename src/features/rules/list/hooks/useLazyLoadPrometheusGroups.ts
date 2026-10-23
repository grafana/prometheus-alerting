import { useCallback, useState } from 'react';
import { useAsync } from '@react-hookz/web';
import { noop } from 'lodash';

import { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { isLoading as isLoadingState } from '../../../../hooks/asyncStateGuards';

/**
 * Provides lazy loading for rule groups.
 * Instead of loading all groups at once, it uses a generator to fetch them in batches as needed,
 * which helps with performance when dealing with large numbers of rules.
 *
 * @param groupsGenerator - An async generator that yields rule groups in batches
 * @param pageSize - Number of groups to display per page
 * @returns Groups loaded so far and controls for navigating through rule groups
 */
export function useLazyLoadPrometheusGroups<TGroup extends PromRuleGroupDTO>(
  groupsGenerator: AsyncIterator<TGroup>,
  pageSize: number,
  filter?: (group: TGroup) => boolean
) {
  const [groups, setGroups] = useState<TGroup[]>([]);
  const [hasMoreGroups, setHasMoreGroups] = useState<boolean>(true);
  // Whether the data source sent any group at all, matching the filter or not
  const [hasReceivedGroups, setHasReceivedGroups] = useState(false);

  const [groupsRequestState, { execute }] = useAsync(async () => {
    let done = false;
    const currentGroups: TGroup[] = [];

    while (currentGroups.length < pageSize) {
      const generatorResult = await groupsGenerator.next();
      if (generatorResult.done) {
        done = true;
        break;
      }

      const group = generatorResult.value;
      setHasReceivedGroups(true);
      if (filter && !filter(group)) {
        continue;
      }

      currentGroups.push(group);
    }

    if (done) {
      setHasMoreGroups(false);
    }

    setGroups((groups) => groups.concat(currentGroups));
  });

  // useAsync keeps a failure in its state (`error` below), but also hands back the failed promise.
  // Nobody waits on that promise, so without the catch every failed page ends up as an unhandled rejection.
  const fetchMoreGroups = useCallback(() => {
    execute().catch(noop);
  }, [execute]);

  // Load initial groups on mount using useEffectOnce pattern
  const [initialized, setInitialized] = useState(false);
  if (!initialized) {
    setInitialized(true);
    fetchMoreGroups();
  }

  const isLoading = isLoadingState(groupsRequestState);

  return {
    isLoading,
    error: groupsRequestState.error,
    groups,
    hasReceivedGroups,
    hasMoreGroups,
    fetchMoreGroups,
  };
}
