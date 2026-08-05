import React, { useMemo } from 'react';

import { EmptyState, LinkButton, Stack } from '@grafana/ui';
import { t, Trans } from '@grafana/i18n';

import { getExternalRulesSources } from '../../../utils/datasource';
import { NEW_DATA_SOURCE_URL } from '../../../constants';

import { DataSourceLoader } from './DataSourceLoader';

interface GroupedViewProps {
  groupFilter?: string;
  namespaceFilter?: string;
  dataSourceFilter?: string[];
}

export function GroupedView({ groupFilter, namespaceFilter, dataSourceFilter }: GroupedViewProps) {
  // Determine if non-datasource filters are active (namespace or group)
  // When these are active, hide datasources with errors or no matching results
  const hasContentFilters = Boolean(namespaceFilter || groupFilter);
  const allExternalRuleSources = useMemo(() => getExternalRulesSources(), []);

  // Filter datasources if dataSourceFilter is provided (contains names)
  const externalRuleSources = useMemo(() => {
    if (!dataSourceFilter || dataSourceFilter.length === 0) {
      return allExternalRuleSources;
    }
    return allExternalRuleSources.filter((ds) => dataSourceFilter.includes(ds.name));
  }, [allExternalRuleSources, dataSourceFilter]);

  /* Without a Prometheus-compatible data source there is nothing to load rules from – say so instead of
     rendering an empty list. */
  if (allExternalRuleSources.length === 0) {
    return (
      <EmptyState
        variant="not-found"
        message={t('alerting.rule-list.no-rules-sources-title', 'No rules data sources configured')}
      >
        <Trans i18nKey="alerting.rule-list.no-rules-sources">
          Alert and recording rules are read from Prometheus, Mimir and Loki data sources. Add one to see rules here.
        </Trans>
        <br />
        <br />
        <LinkButton href={NEW_DATA_SOURCE_URL} icon="plus">
          <Trans i18nKey="alerting.rule-list.no-rules-sources-add-data-source">Add data source</Trans>
        </LinkButton>
      </EmptyState>
    );
  }

  return (
    <Stack direction="column" gap={1} role="list">
      {externalRuleSources.map((ruleSource) => {
        return (
          <DataSourceLoader
            key={ruleSource.uid}
            rulesSourceIdentifier={ruleSource}
            groupFilter={groupFilter}
            namespaceFilter={namespaceFilter}
            hideOnEmptyOrError={hasContentFilters}
          />
        );
      })}
    </Stack>
  );
}
