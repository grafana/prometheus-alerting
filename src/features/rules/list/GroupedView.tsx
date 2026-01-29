import React, { useMemo } from 'react';

import { Stack } from '@grafana/ui';

import { getExternalRulesSources } from '../../../utils/datasource';

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
