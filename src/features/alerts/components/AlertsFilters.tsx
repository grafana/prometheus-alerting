import React, { useMemo } from 'react';

import { t } from '@grafana/i18n';
import { Checkbox, Counter, Input, MultiCombobox, Stack } from '@grafana/ui';
import type { AlertGroup } from '@grafana/external-alertmanager/vanilla';

import type { AlertsFiltersState, AlertsFiltersActions } from '../hooks/useAlertsFilters';
import { countAlertsByState } from '../utils/alerts.utils';

interface AlertsFiltersProps {
  filters: AlertsFiltersState;
  actions: AlertsFiltersActions;
  alertGroups: AlertGroup[];
}

export function AlertsFilters({ filters, actions, alertGroups }: AlertsFiltersProps) {
  const receiverOptions = Array.from(new Set(alertGroups.map((g) => g.receiver.name))).map((name) => ({
    label: name,
    value: name,
  }));

  // Count across all alerts, optionally scoped to the selected receivers
  const counts = useMemo(() => {
    const groups =
      filters.receivers.length > 0
        ? alertGroups.filter((g) => filters.receivers.includes(g.receiver.name))
        : alertGroups;
    const allAlerts = groups.flatMap((g) => g.alerts);
    return countAlertsByState(allAlerts);
  }, [alertGroups, filters.receivers]);

  return (
    <Stack direction="row" gap={2} alignItems="center">
      <Input
        width={32}
        value={filters.labelInput}
        onChange={(e) => actions.setLabelInput(e.currentTarget.value)}
        placeholder={t('alerts.filters.label-placeholder', 'Filter by labels, e.g. foo=bar, env=~prod.*')}
      />
      <MultiCombobox
        width={24}
        options={receiverOptions}
        value={filters.receivers}
        onChange={(values) => actions.setReceivers(values.map((o) => o.value))}
        placeholder={t('alerts.filters.receiver-placeholder', 'Filter by receiver')}
      />
      <Stack direction="row" gap={0.5} alignItems="center">
        <Checkbox
          label={t('alerts.filters.active', 'Active')}
          value={filters.showActive}
          onChange={(e) => actions.setShowActive(e.currentTarget.checked)}
        />
        <Counter value={counts.active} />
      </Stack>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Checkbox
          label={t('alerts.filters.unprocessed', 'Unprocessed')}
          value={filters.showUnprocessed}
          onChange={(e) => actions.setShowUnprocessed(e.currentTarget.checked)}
        />
        <Counter value={counts.unprocessed} />
      </Stack>
      <Stack direction="row" gap={0.5} alignItems="center">
        <Checkbox
          label={t('alerts.filters.suppressed', 'Suppressed')}
          value={filters.showSuppressed}
          onChange={(e) => actions.setShowSuppressed(e.currentTarget.checked)}
        />
        <Counter value={counts.suppressed} />
      </Stack>
    </Stack>
  );
}
