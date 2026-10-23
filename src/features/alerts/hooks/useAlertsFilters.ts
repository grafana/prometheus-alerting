import { useCallback, useMemo, useReducer } from 'react';
import { type AlertGroup } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { parseMatchers } from '../../../utils/labels';
import { filterAlertGroups } from '../utils/alerts.utils';
import { type FilterValues, filtersReducer, initialFilters } from './alertsFiltersReducer';

export interface AlertsFiltersState extends FilterValues {
  labelInputError?: string;
}

export interface AlertsFiltersActions {
  updateFilters: (changes: Partial<FilterValues>) => void;
  clearFilters: () => void;
}

export interface UseAlertsFiltersResult {
  filters: AlertsFiltersState;
  actions: AlertsFiltersActions;
  applyFilters: (groups: AlertGroup[]) => AlertGroup[];
}

export function useAlertsFilters(): UseAlertsFiltersResult {
  const [values, dispatch] = useReducer(filtersReducer, initialFilters);

  // dispatch never changes, so these functions stay the same between renders
  const actions = useMemo<AlertsFiltersActions>(
    () => ({
      updateFilters: (changes) => dispatch({ type: 'update', changes }),
      clearFilters: () => dispatch({ type: 'clear' }),
    }),
    []
  );

  const labelFilter = useMemo(() => parseMatchers(values.labelInput), [values.labelInput]);

  const applyFilters = useCallback(
    (groups: AlertGroup[]) => filterAlertGroups(groups, values, labelFilter),
    [values, labelFilter]
  );

  return {
    filters: {
      ...values,
      labelInputError: labelFilter.error
        ? t('alerts.filters.label-input-invalid', 'Invalid label matcher syntax')
        : undefined,
    },
    actions,
    applyFilters,
  };
}
