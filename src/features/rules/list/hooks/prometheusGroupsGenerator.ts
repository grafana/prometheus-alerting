import { useCallback } from 'react';

import { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { PromRulesResponse, prometheusApi } from '../../../../api/prometheus.endpoints';
import { DataSourceRulesSourceIdentifier } from '../../../../types/datasources';

const { useLazyGetGroupsQuery } = prometheusApi;

interface FetchGroupsOptions {
  groupLimit?: number;
  groupNextToken?: string;
}

export function usePrometheusGroupsGenerator() {
  const [getGroups] = useLazyGetGroupsQuery();

  return useCallback(
    async function* (
      ruleSource: DataSourceRulesSourceIdentifier,
      groupLimit: number
    ): AsyncGenerator<PromRuleGroupDTO[], void, unknown> {
      const getRuleSourceGroupsWithCache = async (fetchOptions: FetchGroupsOptions) => {
        const response = await getGroups({
          ruleSource: { uid: ruleSource.uid },
          ...fetchOptions,
        }).unwrap();

        return response;
      };

      yield* genericGroupsGenerator(getRuleSourceGroupsWithCache, groupLimit);
    },
    [getGroups]
  );
}

/**
 * Converts a Prometheus groups generator yielding arrays of groups to a generator yielding groups one by one
 * @param generator - The paginated generator to convert
 * @returns A non-paginated generator that yields all groups from the original generator one by one
 */
export function toIndividualRuleGroups<TGroup extends PromRuleGroupDTO>(
  generator: AsyncGenerator<TGroup[], void, unknown>
): AsyncGenerator<TGroup, void, unknown> {
  return (async function* () {
    for await (const batch of generator) {
      for (const item of batch) {
        yield item;
      }
    }
  })();
}

// Generator lazily provides groups one by one only when needed
// This might look a bit complex but it allows us to have one API for paginated and non-paginated Prometheus data sources
// For unpaginated data sources we fetch everything in one go
// For paginated we fetch the next page when needed
async function* genericGroupsGenerator<TGroup>(
  fetchGroups: (options: FetchGroupsOptions) => Promise<PromRulesResponse>,
  groupLimit: number
) {
  let response = await fetchGroups({ groupLimit });
  yield response.data.groups as TGroup[];

  let lastToken: string | undefined = response.data?.groupNextToken;

  while (lastToken) {
    response = await fetchGroups({ groupNextToken: lastToken, groupLimit: groupLimit });
    yield response.data.groups as TGroup[];
    lastToken = response.data?.groupNextToken;
  }
}
