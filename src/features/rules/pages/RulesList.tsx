import React, { useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { testIds } from '../../../components/testIds';
import { FilterView } from '../list/FilterView';
import { GroupedView } from '../list/GroupedView';

type ViewMode = 'grouped' | 'list';
function RulesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [filterState] = useState({
    namespace: '',
    groupName: '',
    ruleName: '',
  });

  const viewModeOptions: Array<SelectableValue<ViewMode>> = [
    { label: t('alerting.rule-list.view-mode.grouped', 'Grouped'), value: 'grouped' },
    { label: t('alerting.rule-list.view-mode.list', 'List'), value: 'list' },
  ];

  return (
    <PluginPage>
      <div data-testid={testIds.rules.container}>
        <Stack direction="column" gap={2}>
          {/* View mode toggle */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <RadioButtonGroup value={viewMode} options={viewModeOptions} onChange={setViewMode} />
            {/* Placeholder for filter controls - will be added later */}
            <div>{/* TODO: Add filter inputs for namespace, group, and rule name */}</div>
          </Stack>

          {/* Render appropriate view based on mode */}
          {viewMode === 'grouped' ? (
            <GroupedView groupFilter={filterState.groupName} namespaceFilter={filterState.namespace} />
          ) : (
            <FilterView filterState={filterState} />
          )}
        </Stack>
      </div>
    </PluginPage>
  );
}

export default RulesPage;
