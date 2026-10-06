import { useCallback, useMemo } from 'react';

import { from } from 'ix/asynciterable';
import { AsyncIterableX } from 'ix/asynciterable/asynciterablex';
import { empty } from 'ix/asynciterable/empty';
import { merge } from 'ix/asynciterable/merge';
import { catchError, concatMap, withAbort } from 'ix/asynciterable/operators';

import { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { createRulePositionHash } from '@grafana/external-rules/matching';

import {
  DataSourceNamespaceIdentifier,
  DataSourceRuleGroupIdentifier,
  DataSourceRulesSourceIdentifier,
  PromRuleWithOrigin,
} from '../../../../types/rules';
import { getExternalRulesSources } from '../../../../utils/datasource';
import { RulesFilter } from '../../search/rulesSearchParser';

import { groupFilter, ruleFilter } from './filters';
import { usePrometheusGroupsGenerator } from './prometheusGroupsGenerator';
import { toDataSourceRulesError, useDataSourceErrors } from './useDataSourceErrors';

interface GetIteratorResult {
  iterable: AsyncIterableX<PromRuleWithOrigin>;
  abortController: AbortController;
}

export function useFilteredRulesIteratorProvider() {
  const allExternalRulesSources = useMemo(() => getExternalRulesSources(), []);
  const prometheusGroupsGenerator = usePrometheusGroupsGenerator();
  const { reportError } = useDataSourceErrors();

  const getFilteredRulesIterable = useCallback(
    (filterState: RulesFilter, groupLimit: number): GetIteratorResult => {
      // This is the abort controller that allows us to stop an AsyncIterable
      const abortController = new AbortController();

      // Normalize filter state (remove empty strings)
      const normalizedFilterState = {
        dataSourceNames: filterState.dataSourceNames || [],
        namespace: filterState.namespace?.trim() || undefined,
        groupName: filterState.groupName?.trim() || undefined,
        ruleName: filterState.ruleName?.trim() || undefined,
        ruleState: filterState.ruleState?.trim() || undefined,
        ruleType: filterState.ruleType?.trim() || undefined,
        ruleHealth: filterState.ruleHealth?.trim() || undefined,
        labels: filterState.labels || [],
      };

      // Filter data sources if dataSourceNames filter is specified (matches by name)
      const filteredDataSources =
        normalizedFilterState.dataSourceNames.length > 0
          ? allExternalRulesSources.filter((ds) => normalizedFilterState.dataSourceNames.includes(ds.name))
          : allExternalRulesSources;

      // Create generators for each external data source
      const dataSourceGenerators: Array<AsyncIterableX<PromRuleWithOrigin>> = filteredDataSources.map(
        (dataSourceIdentifier) => {
          const promGroupsGenerator: AsyncIterableX<PromRuleWithOrigin> = from(
            prometheusGroupsGenerator(dataSourceIdentifier, groupLimit)
          ).pipe(
            withAbort(abortController.signal),
            concatMap((groups: PromRuleGroupDTO[]) =>
              groups
                .filter((group: PromRuleGroupDTO) => groupFilter(group, normalizedFilterState))
                .flatMap((group: PromRuleGroupDTO) => group.rules.map((rule, index) => ({ group, rule, index })))
                .filter(({ rule }) => ruleFilter(rule, normalizedFilterState))
                .map(({ group, rule, index }) => mapRuleToRuleWithOrigin(dataSourceIdentifier, group, rule, index))
            ),
            // A failing data source should not fail the entire search, we skip its results and
            // report the error so it can be surfaced to the user
            catchError((error: unknown) => {
              // Stopping the search makes every data source that is still loading throw, that is not
              // something wrong with the data source
              if (!abortController.signal.aborted) {
                reportError(toDataSourceRulesError(dataSourceIdentifier.uid, error));
              }
              return empty();
            })
          );

          return promGroupsGenerator;
        }
      );

      // Merge all data source iterables
      const iterable = mergeIterables(dataSourceGenerators);

      return { iterable, abortController };
    },
    [allExternalRulesSources, prometheusGroupsGenerator, reportError]
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
  rule: PromRuleGroupDTO['rules'][0],
  ruleIndex: number
): PromRuleWithOrigin {
  const namespace: DataSourceNamespaceIdentifier = { name: group.file };
  const groupIdentifier: DataSourceRuleGroupIdentifier = {
    rulesSource,
    namespace,
    groupName: group.name,
  };

  return {
    rule,
    groupIdentifier,
    origin: 'datasource',
    rulePositionHash: createRulePositionHash(ruleIndex, group.rules.length),
  };
}
