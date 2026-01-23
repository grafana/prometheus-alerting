import { useMemo } from 'react';
import { alertmanagerApi } from '../../../api/alertmanager/alertmanager.endpoints';
import { useAlertmanager } from '../../../hooks/useAlertmanager';
import type { GettableSilence, GettableAlert } from '@grafana/external-alertmanager/vanilla';

/**
 * Checks if an alert matches a silence based on the silence's matchers.
 * This is used to filter alerts client-side when the API doesn't support
 * filtering by specific silence ID.
 */
function alertMatchesSilence(alert: GettableAlert, silence: GettableSilence): boolean {
  // Check if this specific silence is in the alert's silencedBy array
  if (alert.status.silencedBy?.includes(silence.id)) {
    return true;
  }

  // Fallback: Check if all matchers match the alert labels
  return silence.matchers.every((matcher) => {
    const labelValue = alert.labels[matcher.name];

    if (labelValue === undefined) {
      return false;
    }

    if (matcher.isRegex) {
      try {
        const regex = new RegExp(`^${matcher.value}$`);
        const matches = regex.test(labelValue);
        return matcher.isEqual !== false ? matches : !matches;
      } catch {
        return false;
      }
    }

    const equals = labelValue === matcher.value;
    return matcher.isEqual !== false ? equals : !equals;
  });
}

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
  const { data: allAlerts = [], isLoading, error } = alertmanagerApi.endpoints.getAlerts.useQuery(
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

    return allAlerts.filter((alert) => alertMatchesSilence(alert, silence));
  }, [allAlerts, silence]);

  return {
    alerts: affectedAlerts,
    isLoading,
    error,
  };
}
