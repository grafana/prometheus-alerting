import { useMemo } from 'react';
import { DataSourceInstanceSettings } from '@grafana/data';
import { useAppSelector } from '../store/hooks';
import { selectDataSourceUID } from '../store/datasourceSlice';
import { useAvailableAlertmanagers } from './useAvailableAlertmanager';
import { AlertManagerDataSourceJsonData } from '../types/datasources';

export interface AlertmanagerDataSource {
  uid: string;
  settings: DataSourceInstanceSettings<AlertManagerDataSourceJsonData>;
}

/**
 * Hook to get the currently selected Alertmanager data source with its UID and configuration settings.
 *
 * @returns The currently selected Alertmanager data source with UID and settings, or undefined if not found
 */
export function useAlertmanager(): AlertmanagerDataSource {
  const selectedUID = useAppSelector(selectDataSourceUID);
  const availableAlertmanagers = useAvailableAlertmanagers();

  const alertmanager = useMemo(() => {
    const settings = availableAlertmanagers.find((am) => am.uid === selectedUID);

    if (!settings) {
      throw new Error(`no such Alertmanager: ${selectedUID}`)
    }

    return {
      uid: selectedUID,
      settings,
    };
  }, [selectedUID, availableAlertmanagers]);

  return alertmanager;
}
