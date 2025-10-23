import React, { useEffect, useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { Box, Button, Dropdown, Menu, RadioButtonGroup, Stack } from '@grafana/ui';

import { testIds } from '../../../components/testIds';
import { PLUGIN_BASE_URL } from '../../../constants';
import { RulesFilter } from '../components/RulesFilter';
import { useRulesFilter } from '../hooks/useRulesFilter';
import { FilterView } from '../list/FilterView';
import { GroupedView } from '../list/GroupedView';

type ViewMode = 'grouped' | 'list';
function RulesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const { filterState, hasActiveFilters } = useRulesFilter();

  // Automatically switch to list view when filters are applied
  useEffect(() => {
    if (hasActiveFilters) {
      setViewMode('list');
    }
  }, [hasActiveFilters]);

  const viewModeOptions: Array<SelectableValue<ViewMode>> = [
    { label: t('alerting.rule-list.view-mode.grouped', 'Grouped'), value: 'grouped' },
    { label: t('alerting.rule-list.view-mode.list', 'List'), value: 'list' },
  ];

  const newRuleMenu = (
    <Menu>
      <Menu.Item
        label={t('alerting.rule-list.new-alerting-rule', 'New alerting rule')}
        icon="bell"
        url={`${PLUGIN_BASE_URL}/rules/new?type=alerting`}
      />
      <Menu.Item
        label={t('alerting.rule-list.new-recording-rule', 'New recording rule')}
        icon="chart-line"
        url={`${PLUGIN_BASE_URL}/rules/new?type=recording`}
      />
    </Menu>
  );

  return (
    <PluginPage>
      <div data-testid={testIds.rules.container}>
        <Stack direction="column" gap={2}>
          {/* Search and view controls */}
          <Stack direction="row" alignItems="center" gap={1}>
            <Box flex={1}>
              <RulesFilter />
            </Box>
            <RadioButtonGroup value={viewMode} options={viewModeOptions} onChange={setViewMode} />
            <Dropdown overlay={newRuleMenu} placement="bottom-end">
              <Button icon="plus" variant="primary">
                <Trans i18nKey="alerting.rule-list.new-rule">New rule</Trans>
              </Button>
            </Dropdown>
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
