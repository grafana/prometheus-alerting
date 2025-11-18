import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectDataSourceUID } from '../store/datasourceSlice';
import { useAvailableAlertmanagers } from './useAvailableAlertmanager';
import { AlertmanagerDataSourceSettings } from 'types/datasources';

export interface AlertmanagerHookResult {
  uid: string;
  settings: AlertmanagerDataSourceSettings;
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
    // If no UID is selected yet, try to use the first available Alertmanager
    const uidToFind = selectedUID || availableAlertmanagers[0]?.uid;

    if (!uidToFind) {
      throw new Error('No Alertmanager data sources configured');
    }

    const settings = availableAlertmanagers.find((am) => am.uid === uidToFind);

    if (!settings) {
      throw new Error(`no such Alertmanager: ${uidToFind}`);
    }

    return settings;
  }, [selectedUID, availableAlertmanagers]);

  return {
    uid: settings.uid,
    settings,
  };
}

/**
 * Safe version of useAlertmanager that returns null instead of throwing an error.
 * Use this when you want to handle the absence of an Alertmanager gracefully.
 */
export function useAlertmanagerSafe(): AlertmanagerHookResult | null {
  const selectedUID = useAppSelector(selectDataSourceUID);
  const availableAlertmanagers = useAvailableAlertmanagers();

  const result = useMemo((): AlertmanagerHookResult | null => {
    // If no UID is selected yet, try to use the first available Alertmanager
    const uidToFind = selectedUID || availableAlertmanagers[0]?.uid;

    if (!uidToFind) {
      return null;
    }

    const settings = availableAlertmanagers.find((am) => am.uid === uidToFind);

    if (!settings) {
      return null;
    }

    return {
      uid: settings.uid,
      settings,
    };
  }, [selectedUID, availableAlertmanagers]);

  return result;
}
