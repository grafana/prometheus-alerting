import React, { useCallback, useMemo } from 'react';

import { DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { Select } from '@grafana/ui';

import { isSupportedExternalRulesSourceType } from '../datasourceValidation';

interface Props {
  disabled?: boolean;
  onChange: (ds: DataSourceInstanceSettings) => void;
  value: string | null;
}

export function CloudRulesSourcePicker({ value, disabled, onChange }: Props) {
  // Get all data sources that support Ruler API
  const dataSourceOptions = useMemo(() => {
    const allDataSources = getDataSourceSrv().getList();
    return allDataSources
      .filter((ds) => isSupportedExternalRulesSourceType(ds.type))
      .map((ds) => ({
        label: ds.name,
        value: ds.uid,
      }));
  }, []);

  const handleChange = useCallback(
    (selected: { value?: string }) => {
      if (selected.value) {
        const ds = getDataSourceSrv().getInstanceSettings(selected.value);
        if (ds) {
          onChange(ds);
        }
      }
    },
    [onChange]
  );

  return (
    <Select
      options={dataSourceOptions}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder="Select a data source"
    />
  );
}
