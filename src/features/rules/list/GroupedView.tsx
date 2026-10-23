import React, { useMemo } from 'react';

import { differenceBy, every, isEmpty } from 'lodash';

import { Trans, t } from '@grafana/i18n';
import { EmptyState, Stack } from '@grafana/ui';

import { getExternalRulesSources } from '../../../utils/datasource';

import { DataSourceLoader } from './DataSourceLoader';
import { useDataSourceErrors } from './hooks/useDataSourceErrors';

interface GroupedViewProps {
  groupFilter?: string;
  namespaceFilter?: string;
  dataSourceFilter?: string[];
}

export function GroupedView({ groupFilter, namespaceFilter, dataSourceFilter }: GroupedViewProps) {
  // Determine if non-datasource filters are active (namespace or group)
  // When these are active, hide datasources with no matching results
  const hasContentFilters = Boolean(namespaceFilter || groupFilter);
  const allExternalRuleSources = useMemo(() => getExternalRulesSources(), []);
  const { errors } = useDataSourceErrors();

  // Filter datasources if dataSourceFilter is provided (contains names)
  const externalRuleSources = useMemo(() => {
    if (!dataSourceFilter || dataSourceFilter.length === 0) {
      return allExternalRuleSources;
    }
    return allExternalRuleSources.filter((ds) => dataSourceFilter.includes(ds.name));
  }, [allExternalRuleSources, dataSourceFilter]);

  // Data sources that reported errors or have no rules render nothing – tell the user why the list is empty
  const allSourcesHidden = !isEmpty(externalRuleSources) && isEmpty(differenceBy(externalRuleSources, errors, 'uid'));
  const allSourcesFailed = every(errors, { kind: 'error' });
  const allSourcesEmpty = every(errors, { kind: 'empty' });

  return (
    <Stack direction="column" gap={1}>
      <Stack direction="column" gap={1} role="list">
        {externalRuleSources.map((ruleSource) => {
          return (
            <DataSourceLoader
              key={ruleSource.uid}
              rulesSourceIdentifier={ruleSource}
              groupFilter={groupFilter}
              namespaceFilter={namespaceFilter}
              hideOnEmpty={hasContentFilters}
            />
          );
        })}
      </Stack>
      {allSourcesHidden && (
        <EmptyState
          variant="not-found"
          message={
            allSourcesEmpty
              ? t('alerting.rule-list.grouped-view.all-sources-empty-title', 'No rules found')
              : t('alerting.rule-list.grouped-view.all-sources-failed-title', 'No rules could be loaded')
          }
        >
          {allSourcesFailed && (
            <Trans i18nKey="alerting.rule-list.grouped-view.all-sources-failed">
              All data sources reported errors.
            </Trans>
          )}
          {allSourcesEmpty && (
            <Trans i18nKey="alerting.rule-list.grouped-view.all-sources-empty">
              None of the data sources have any rules.
            </Trans>
          )}
          {!allSourcesFailed && !allSourcesEmpty && (
            <Trans i18nKey="alerting.rule-list.grouped-view.all-sources-hidden">
              Every data source either reported errors or has no rules.
            </Trans>
          )}
        </EmptyState>
      )}
    </Stack>
  );
}
