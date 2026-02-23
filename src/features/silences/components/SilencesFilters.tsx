import React from 'react';
import { Checkbox, Input, Stack } from '@grafana/ui';
import { t } from '@grafana/i18n';
import type { SilencesFiltersState, SilencesFiltersActions } from '../hooks/useSilencesFilters';

interface SilencesFiltersProps {
  filters: SilencesFiltersState;
  actions: SilencesFiltersActions;
}

export function SilencesFilters({ filters, actions }: SilencesFiltersProps) {
  return (
    <Stack direction="row" gap={2} alignItems="center">
      <Input
        width={32}
        value={filters.matcherInput}
        onChange={(e) => actions.setMatcherInput(e.currentTarget.value)}
        placeholder={t('silences.filters.matcher-placeholder', 'Filter by matcher, e.g. foo="bar"')}
      />
      <Checkbox
        label={t('silences.show-inactive', 'Show inactive silences')}
        value={filters.showInactive}
        onChange={(e) => actions.setShowInactive(e.currentTarget.checked)}
      />
    </Stack>
  );
}
