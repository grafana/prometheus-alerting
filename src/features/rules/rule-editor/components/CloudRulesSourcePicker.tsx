import React, { useMemo } from 'react';

import { DataSourceInstanceSettings } from '@grafana/data';
import { t } from '@grafana/i18n';
import { getDataSourceSrv } from '@grafana/runtime';
import { Combobox, type ComboboxOption } from '@grafana/ui';

import { useRulesSourcesWithRuler } from '../hooks/useRulesSourcesWithRuler';

interface Props {
  disabled?: boolean;
  onChange: (ds: DataSourceInstanceSettings) => void;
  value: string | null;
}

export function CloudRulesSourcePicker({ value, disabled, onChange }: Props) {
  // Get all data sources that support Ruler API
  const { rulesSourcesWithRuler, isLoading } = useRulesSourcesWithRuler();

  const dataSourceOptions = useMemo(() => {
    return rulesSourcesWithRuler.map((ds) => ({
      label: ds.name,
      value: ds.uid,
      description: ds.type,
    }));
  }, [rulesSourcesWithRuler]);

  const selectedOption = useMemo(() => {
    return dataSourceOptions.find((opt) => opt.value === value);
  }, [dataSourceOptions, value]);

  const handleChange = (option: ComboboxOption<string> | null) => {
    if (option?.value) {
      const ds = getDataSourceSrv().getInstanceSettings(option.value);
      if (ds) {
        onChange(ds);
      }
    }
  };

  return (
    <Combobox
      options={dataSourceOptions}
      value={selectedOption}
      onChange={handleChange}
      disabled={disabled || isLoading}
      placeholder={
        isLoading
          ? t('alerting.cloud-rules-source-picker.loading', 'Loading data sources...')
          : t('alerting.cloud-rules-source-picker.placeholder', 'Select a data source')
      }
    />
  );
}
