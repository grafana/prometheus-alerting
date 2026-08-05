import React, { useMemo } from 'react';

import { Trans, t } from '@grafana/i18n';
import { EmptyState, Stack } from '@grafana/ui';

import { getExternalRulesSources } from '../../../utils/datasource';

import { DataSourceLoader } from './DataSourceLoader';
import { DataSourceErrorsFooter } from './components/DataSourceErrorsStatus';
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

  // Data sources reporting errors render nothing – tell the user why the list is empty
  const erroredUids = new Set(errors.map((error) => error.uid));
  const allSourcesFailed =
    externalRuleSources.length > 0 && externalRuleSources.every((ruleSource) => erroredUids.has(ruleSource.uid));

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
      {allSourcesFailed && (
        <EmptyState
          variant="not-found"
          message={t('alerting.rule-list.grouped-view.all-sources-failed-title', 'No rules could be loaded')}
        >
          <Trans i18nKey="alerting.rule-list.grouped-view.all-sources-failed">All data sources reported errors.</Trans>
        </EmptyState>
      )}
      <DataSourceErrorsFooter />
    </Stack>
  );
}
