import React from 'react';
import { Checkbox } from '@grafana/ui';
import { t } from '@grafana/i18n';
import type { SilencesFiltersState, SilencesFiltersActions } from '../hooks/useSilencesFilters';

interface SilencesFiltersProps {
  filters: SilencesFiltersState;
  actions: SilencesFiltersActions;
}

export function SilencesFilters({ filters, actions }: SilencesFiltersProps) {
  return (
    <Checkbox
      label={t('silences.show-inactive', 'Show inactive silences')}
      value={filters.showInactive}
      onChange={(e) => actions.setShowInactive(e.currentTarget.checked)}
    />
  );
}
