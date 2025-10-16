import { useCallback, useMemo } from 'react';

import { from } from 'ix/asynciterable';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { empty } from 'ix/asynciterable/empty';
import { merge } from 'ix/asynciterable/merge';
import { catchError, concatMap, withAbort } from 'ix/asynciterable/operators';

import { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import {
  DataSourceNamespaceIdentifier,
  DataSourceRuleGroupIdentifier,
  DataSourceRulesSourceIdentifier,
  PromRuleWithOrigin,
} from '../../../../types/rules';
import { getExternalRulesSources } from '../../../../utils/datasource';

import { groupFilter, ruleFilter } from './filters';
import { usePrometheusGroupsGenerator } from './prometheusGroupsGenerator';

export interface SimpleFilterState {
  namespace?: string;
  groupName?: string;
  ruleName?: string;
}

interface GetIteratorResult {
  iterable: AsyncIterableX<PromRuleWithOrigin>;
  abortController: AbortController;
}

export function useFilteredRulesIteratorProvider() {
  const allExternalRulesSources = useMemo(() => getExternalRulesSources(), []);
  const prometheusGroupsGenerator = usePrometheusGroupsGenerator();

  const getFilteredRulesIterable = useCallback(
    (filterState: SimpleFilterState, groupLimit: number): GetIteratorResult => {
      // This is the abort controller that allows us to stop an AsyncIterable
      const abortController = new AbortController();

      // Normalize filter state (remove empty strings)
      const normalizedFilterState = {
        namespace: filterState.namespace?.trim() || undefined,
        groupName: filterState.groupName?.trim() || undefined,
        ruleName: filterState.ruleName?.trim() || undefined,
      };

      // Create generators for each external data source
      const dataSourceGenerators: Array<AsyncIterableX<PromRuleWithOrigin>> = allExternalRulesSources.map(
        (dataSourceIdentifier) => {
          const promGroupsGenerator: AsyncIterableX<PromRuleWithOrigin> = from(
            prometheusGroupsGenerator(dataSourceIdentifier, groupLimit)
          ).pipe(
            withAbort(abortController.signal),
            concatMap((groups: PromRuleGroupDTO[]) =>
              groups
                .filter((group: PromRuleGroupDTO) => groupFilter(group, normalizedFilterState))
                .flatMap((group: PromRuleGroupDTO) => group.rules.map((rule) => ({ group, rule })))
                .filter(({ rule }) => ruleFilter(rule, normalizedFilterState))
                .map(({ group, rule }) => mapRuleToRuleWithOrigin(dataSourceIdentifier, group, rule))
            ),
            catchError(() => empty())
          );

          return promGroupsGenerator;
        }
      );

      // Merge all data source iterables
      const iterable = mergeIterables(dataSourceGenerators);

      return { iterable, abortController };
    },
    [allExternalRulesSources, prometheusGroupsGenerator]
  );

  return getFilteredRulesIterable;
}

function mergeIterables(iterables: Array<AsyncIterableX<PromRuleWithOrigin>>): AsyncIterableX<PromRuleWithOrigin> {
  if (iterables.length === 0) {
    return empty();
  }
  if (iterables.length === 1) {
    return iterables[0];
  }
  return merge(iterables[0], ...iterables.slice(1));
}

function mapRuleToRuleWithOrigin(
  rulesSource: DataSourceRulesSourceIdentifier,
  group: PromRuleGroupDTO,
  rule: PromRuleGroupDTO['rules'][0]
): PromRuleWithOrigin {
  const namespace: DataSourceNamespaceIdentifier = { name: group.file };
  const groupIdentifier: DataSourceRuleGroupIdentifier = {
    rulesSource,
    namespace,
    groupName: group.name,
    groupOrigin: 'datasource',
  };

  return {
    rule,
    groupIdentifier,
    origin: 'datasource',
  };
}
