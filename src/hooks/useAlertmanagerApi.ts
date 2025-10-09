import { useMemo } from 'react';
import { createAlertmanagerApi } from '@grafana/external-alertmanager/vanilla';
import { useDataSource } from '../contexts/DataSourceContext';

export function useAlertmanagerApi() {
  const { dataSourceUID } = useDataSource();

  const api = useMemo(() => {
    return createAlertmanagerApi(dataSourceUID);
  }, [dataSourceUID]);

  return api;
}
