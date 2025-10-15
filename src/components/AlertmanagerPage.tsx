import React, { ComponentProps, useMemo } from 'react';
import { PluginPage } from '@grafana/runtime';
import { Combobox, InlineField, type ComboboxOption } from '@grafana/ui';
import { useAvailableAlertmanagers } from '../hooks/useAvailableAlertmanager';
import { convertDataSourcesToComboboxOptions } from '../utils/utils.alertmanager';
import { STORAGE_KEYS } from '../constants';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectDataSourceUID, setDataSourceUID } from '../store/datasourceSlice';
import { t } from '@grafana/i18n';

/**
 * Wrapper component for Alertmanager pages that provides:
 * - PluginPage layout
 * - Alertmanager data source selector dropdown in the actions area
 * - Automatic state management for selected alertmanager
 *
 * Usage:
 * ```tsx
 * <AlertmanagerPage>
 *   <YourPageContent />
 * </AlertmanagerPage>
 * ```
 */
export function AlertmanagerPage({ children, ...props }: ComponentProps<typeof PluginPage>) {
  const dispatch = useAppDispatch();
  const dataSourceUID = useAppSelector(selectDataSourceUID);

  const alertmanagers = useAvailableAlertmanagers();
  const alertmanagerOptions = convertDataSourcesToComboboxOptions(alertmanagers);

  const selectedOption = useMemo(() => {
    return alertmanagerOptions.find((opt) => opt.value === dataSourceUID);
  }, [alertmanagerOptions, dataSourceUID]);

  const handleAlertmanagerChange = (option: ComboboxOption<string>) => {
    sessionStorage.setItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID, option.value);
    dispatch(setDataSourceUID(option.value));
  };

  return (
    <PluginPage
      actions={
        <InlineField label={t('pages.alertmanager-picker.label', 'Choose Alertmanager')}>
          <Combobox options={alertmanagerOptions} value={selectedOption} onChange={handleAlertmanagerChange} />
        </InlineField>
      }
      {...props}
    >
      {children}
    </PluginPage>
  );
}
