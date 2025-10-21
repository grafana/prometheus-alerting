import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectDataSourceUID } from '../store/datasourceSlice';
import { useAvailableAlertmanagers } from './useAvailableAlertmanager';
import { AlertmanagerDataSourceSettings } from 'types/datasources';

export interface AlertmanagerHookResult {
  uid: string;
  settings: AlertmanagerDataSourceSettings;
  hasConfigurationAPI: boolean;
}

/**
 * Hook to get the currently selected Alertmanager data source with its UID and configuration settings.
 *
 * @returns The currently selected Alertmanager data source with UID and settings, or undefined if not found
 */
export function useAlertmanager(): AlertmanagerHookResult {
  const selectedUID = useAppSelector(selectDataSourceUID);
  const availableAlertmanagers = useAvailableAlertmanagers();

  const settings = useMemo(() => {
    const settings = availableAlertmanagers.find((am) => am.uid === selectedUID);

    if (!settings) {
      throw new Error(`no such Alertmanager: ${selectedUID}`);
    }

    return settings;
  }, [selectedUID, availableAlertmanagers]);

  return {
    uid: selectedUID,
    settings,
    hasConfigurationAPI: settings.jsonData.implementation !== 'prometheus',
  };
}
