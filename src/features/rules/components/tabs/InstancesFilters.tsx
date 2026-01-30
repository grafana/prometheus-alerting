import React from 'react';
import { css } from '@emotion/css';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { FilterInput, RadioButtonGroup, useStyles2, Stack, Label } from '@grafana/ui';

import { StateFilterOption, StateCount } from './useInstancesFilter';

interface Props {
  searchText: string;
  stateFilter: StateFilterOption;
  stateCounts: StateCount;
  onSearchChange: (text: string) => void;
  onStateChange: (state: StateFilterOption) => void;
}

export function InstancesFilters({ searchText, stateFilter, stateCounts, onSearchChange, onStateChange }: Props) {
  const styles = useStyles2(getStyles);

  const stateOptions: Array<SelectableValue<StateFilterOption>> = [
    {
      label:
        stateCounts.all > 0
          ? t('rule-details.instances.filter.state-all-count', 'All ({{count}})', { count: stateCounts.all })
          : t('rule-details.instances.filter.state-all', 'All'),
      value: 'all',
    },
    {
      label:
        stateCounts.firing > 0
          ? t('rule-details.instances.filter.state-firing-count', 'Firing ({{count}})', {
              count: stateCounts.firing,
            })
          : t('rule-details.instances.filter.state-firing', 'Firing'),
      value: 'firing',
    },
    {
      label:
        stateCounts.pending > 0
          ? t('rule-details.instances.filter.state-pending-count', 'Pending ({{count}})', {
              count: stateCounts.pending,
            })
          : t('rule-details.instances.filter.state-pending', 'Pending'),
      value: 'pending',
    },
  ];

  return (
    <Stack direction="row" gap={3} alignItems="flex-end" wrap="wrap">
      {/* Search by label */}
      <div className={styles.searchContainer}>
        <FilterInput
          placeholder={t('rule-details.instances.filter.search-placeholder', 'Search by label')}
          value={searchText}
          onChange={onSearchChange}
          escapeRegex={false}
        />
      </div>

      {/* State filter */}
      <div>
        <Label>{t('rule-details.instances.filter.state-label', 'State')}</Label>
        <RadioButtonGroup options={stateOptions} value={stateFilter} onChange={onStateChange} />
      </div>
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  searchContainer: css({
    width: '300px',
  }),
});
