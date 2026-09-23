import { useMemo } from 'react';
import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import { alertMatchesSilence } from '../utils/matchesSilenceMatcher';
import type { GettableSilence, GettableAlert } from '@grafana/external-alertmanager/vanilla';

interface UseAffectedAlertsResult {
  alerts: GettableAlert[];
  isLoading: boolean;
  error: unknown;
}

/**
 * Hook to fetch alerts that are affected (silenced) by a specific silence.
 */
export function useAffectedAlerts(silence: GettableSilence | null): UseAffectedAlertsResult {
  const { uid: dataSourceUID } = useAlertmanager();

  // Fetch all silenced alerts
  const {
    data: allAlerts = [],
    isLoading,
    error,
  } = alertmanagerApi.endpoints.getAlerts.useQuery(
    {
      dataSourceUID,
      silenced: true,
      active: true,
      inhibited: true,
    },
    {
      skip: !silence,
    }
  );

  // Filter to only alerts that match this specific silence
  const affectedAlerts = useMemo(() => {
    if (!silence || !allAlerts.length) {
      return [];
    }

    return allAlerts.filter((alert: GettableAlert) => alertMatchesSilence(alert, silence));
  }, [allAlerts, silence]);

  return {
    alerts: affectedAlerts,
    isLoading,
    error,
  };
}
