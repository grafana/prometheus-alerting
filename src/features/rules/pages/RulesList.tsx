import React, { useDeferredValue, useMemo, useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { PluginPage } from '@grafana/runtime';
import { Box, Button, Dropdown, EmptyState, LinkButton, Menu, RadioButtonGroup, Stack } from '@grafana/ui';

import { testIds } from '../../../components/testIds';
import { NEW_DATA_SOURCE_URL, PLUGIN_BASE_URL } from '../../../constants';
import { getExternalRulesSources } from '../../../utils/datasource';
import { RulesFilter } from '../components/RulesFilter';
import { RulesFilterSidebar } from '../components/RulesFilterSidebar';
import { AlertingAction, isAbilityAllowed, useUnscopedAbilities } from '../../../access-control/abilities';
import { useRulesFilter } from '../hooks/useRulesFilter';
import { FilterView } from '../list/FilterView';
import { GroupedView } from '../list/GroupedView';
import { DataSourceErrorsProvider } from '../list/hooks/useDataSourceErrors';

type ViewMode = 'grouped' | 'list';

function RulesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const { filterState, hasActiveFilters } = useRulesFilter();
  const filterSnapshot = useMemo(() => ({ filterState, hasActiveFilters }), [filterState, hasActiveFilters]);
  const deferredFilterSnapshot = useDeferredValue(filterSnapshot);
  const canCreateRules = isAbilityAllowed(useUnscopedAbilities()[AlertingAction.CreateRule]);
  const hasRulesSources = useMemo(() => getExternalRulesSources().length > 0, []);

  // When filters are active, always show list view regardless of the user's preference.
  // This avoids calling setState inside an effect and eliminates the double render.
  const effectiveViewMode: ViewMode = deferredFilterSnapshot.hasActiveFilters ? 'list' : viewMode;

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

  /* Without a Prometheus-compatible data source there is nothing to load rules from – say so instead of
     rendering an empty list. This has to happen before we pick a view: both GroupedView and FilterView
     would otherwise render a misleading "nothing matched your filters" state. */
  if (!hasRulesSources) {
    return (
      <PluginPage subTitle={t('rules.page-subtitle', 'Manage and monitor alert rules from your data sources')}>
        <div data-testid={testIds.rules.container}>
          <EmptyState
            variant="not-found"
            message={t('alerting.rule-list.no-rules-sources-title', 'No rules data sources configured')}
          >
            <Stack direction="column" gap={2} alignItems="center">
              <Trans i18nKey="alerting.rule-list.no-rules-sources">
                Alert and recording rules are read from Prometheus, Mimir and Loki data sources. Add one to see rules
                here.
              </Trans>
              <LinkButton href={NEW_DATA_SOURCE_URL} icon="plus">
                <Trans i18nKey="alerting.rule-list.no-rules-sources-add-data-source">Add data source</Trans>
              </LinkButton>
            </Stack>
          </EmptyState>
        </div>
      </PluginPage>
    );
  }

  return (
    <PluginPage subTitle={t('rules.page-subtitle', 'Manage and monitor alert rules from your data sources')}>
      <DataSourceErrorsProvider>
        <div data-testid={testIds.rules.container}>
          <Stack direction="column" gap={2}>
            {/* Search and view controls */}
            <Stack direction="row" alignItems="center" gap={1}>
              <Box flex={1}>
                <RulesFilter />
              </Box>
              <RadioButtonGroup value={effectiveViewMode} options={viewModeOptions} onChange={setViewMode} />
              {canCreateRules && (
                <Dropdown overlay={newRuleMenu} placement="bottom-end">
                  <Button icon="plus" variant="primary">
                    <Trans i18nKey="alerting.rule-list.new-rule">New rule</Trans>
                  </Button>
                </Dropdown>
              )}
            </Stack>

            {/* Sidebar + rule list */}
            <div style={{ display: 'flex', gap: '16px', minHeight: 0 }}>
              <RulesFilterSidebar />
              <div style={{ flex: 1, minWidth: 0 }}>
                {effectiveViewMode === 'grouped' ? (
                  <GroupedView
                    groupFilter={deferredFilterSnapshot.filterState.groupName}
                    namespaceFilter={deferredFilterSnapshot.filterState.namespace}
                    dataSourceFilter={deferredFilterSnapshot.filterState.dataSourceNames}
                  />
                ) : (
                  <FilterView filterState={deferredFilterSnapshot.filterState} />
                )}
              </div>
            </div>
          </Stack>
        </div>
      </DataSourceErrorsProvider>
    </PluginPage>
  );
}

export default RulesPage;
