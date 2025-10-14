import React, { useMemo } from 'react';

import { Stack } from '@grafana/ui';

import { getExternalRulesSources } from '../utils/datasource';

import { DataSourceLoader } from './DataSourceLoader';

interface GroupedViewProps {
  groupFilter?: string;
  namespaceFilter?: string;
}

export function GroupedView({ groupFilter, namespaceFilter }: GroupedViewProps) {
  const externalRuleSources = useMemo(() => getExternalRulesSources(), []);

  return (
    <Stack direction="column" gap={1} role="list">
      {externalRuleSources.map((ruleSource) => {
        return (
          <DataSourceLoader
            key={ruleSource.uid}
            rulesSourceIdentifier={ruleSource}
            groupFilter={groupFilter}
            namespaceFilter={namespaceFilter}
          />
        );
      })}
    </Stack>
  );
}
