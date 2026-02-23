import { useState, useMemo } from 'react';
import type { AlertGroup } from '@grafana/external-alertmanager/vanilla';

export interface AlertsFiltersState {
  receiver: string;
  showActive: boolean;
  showUnprocessed: boolean;
  showSuppressed: boolean;
}

export interface AlertsFiltersActions {
  setReceiver: (receiver: string) => void;
  setShowActive: (show: boolean) => void;
  setShowUnprocessed: (show: boolean) => void;
  setShowSuppressed: (show: boolean) => void;
}

export interface UseAlertsFiltersResult {
  filters: AlertsFiltersState;
  actions: AlertsFiltersActions;
  applyFilters: (groups: AlertGroup[]) => AlertGroup[];
}

export function useAlertsFilters(): UseAlertsFiltersResult {
  const [receiver, setReceiver] = useState('');
  const [showActive, setShowActive] = useState(true);
  const [showUnprocessed, setShowUnprocessed] = useState(false);
  const [showSuppressed, setShowSuppressed] = useState(false);

  const applyFilters = useMemo(
    () => (groups: AlertGroup[]) => {
      const allowedStates = new Set([
        ...(showActive ? ['active'] : []),
        ...(showUnprocessed ? ['unprocessed'] : []),
        ...(showSuppressed ? ['suppressed'] : []),
      ]);

      return groups
        .filter((group) => !receiver || group.receiver.name === receiver)
        .filter((group) => group.alerts.some((alert) => allowedStates.has(alert.status.state)));
    },
    [receiver, showActive, showUnprocessed, showSuppressed]
  );

  return {
    filters: { receiver, showActive, showUnprocessed, showSuppressed },
    actions: { setReceiver, setShowActive, setShowUnprocessed, setShowSuppressed },
    applyFilters,
  };
}
