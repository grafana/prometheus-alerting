import React, { useMemo } from 'react';
import { Combobox, InlineField, type ComboboxOption } from '@grafana/ui';
import { t } from '@grafana/i18n';
import { useAvailableAlertmanagers } from '../../hooks/useAvailableAlertmanager';
import { convertDataSourcesToComboboxOptions } from '../../utils/utils.alertmanager';
import { STORAGE_KEYS } from '../../constants';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectDataSourceUID, setDataSourceUID } from '../../store/datasourceSlice';

interface AlertmanagerPickerProps {
  /**
   * Optional label for the picker. Defaults to "Choose Alertmanager"
   */
  label?: string;
  /**
   * Whether to always show the picker, even if there's only one Alertmanager.
   * Defaults to false (only shows when there are multiple options)
   */
  alwaysShow?: boolean;
}

export function AlertmanagerPicker({ label, alwaysShow = false }: AlertmanagerPickerProps) {
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

  const shouldShow = alwaysShow || alertmanagerOptions.length > 1;

  if (!shouldShow) {
    return null;
  }

  return (
    <InlineField label={label ?? t('components.alertmanager-picker.label', 'Choose Alertmanager')}>
      <Combobox options={alertmanagerOptions} value={selectedOption} onChange={handleAlertmanagerChange} />
    </InlineField>
  );
}
