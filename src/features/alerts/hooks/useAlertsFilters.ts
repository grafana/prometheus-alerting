import { useState, useMemo } from 'react';
import { type AlertGroup, type AlertStatus} from '@grafana/external-alertmanager/vanilla';
import { alertMatchesFilters, parseMatchers } from '../utils/alerts.utils';

export interface AlertsFiltersState {
  receivers: string[];
  showActive: boolean;
  showUnprocessed: boolean;
  showSuppressed: boolean;
  labelInput: string;
}

export interface AlertsFiltersActions {
  setReceivers: (receivers: string[]) => void;
  setShowActive: (show: boolean) => void;
  setShowUnprocessed: (show: boolean) => void;
  setShowSuppressed: (show: boolean) => void;
  setLabelInput: (input: string) => void;
}

export interface UseAlertsFiltersResult {
  filters: AlertsFiltersState;
  actions: AlertsFiltersActions;
  applyFilters: (groups: AlertGroup[]) => AlertGroup[];
}


export function useAlertsFilters(): UseAlertsFiltersResult {
  const [receivers, setReceivers] = useState<string[]>([]);
  const [showActive, setShowActive] = useState(true);
  const [showUnprocessed, setShowUnprocessed] = useState(false);
  const [showSuppressed, setShowSuppressed] = useState(false);
  const [labelInput, setLabelInput] = useState('');

  const applyFilters = useMemo(
    () => (groups: AlertGroup[]) => {
      const allowedStates = new Set<AlertStatus['state']>([
        ...(showActive ? ['active' as const] : []),
        ...(showUnprocessed ? ['unprocessed' as const] : []),
        ...(showSuppressed ? ['suppressed' as const] : []),
      ]);

      const matchers = parseMatchers(labelInput);

      return groups
        .filter((group) => receivers.length === 0 || receivers.includes(group.receiver.name))
        .map((group) => ({
          ...group,
          alerts: group.alerts.filter((alert) => alertMatchesFilters(alert, allowedStates, matchers)),
        }))
        .filter((group) => group.alerts.length > 0);
    },
    [receivers, showActive, showUnprocessed, showSuppressed, labelInput]
  );

  return {
    filters: { receivers, showActive, showUnprocessed, showSuppressed, labelInput },
    actions: { setReceivers, setShowActive, setShowUnprocessed, setShowSuppressed, setLabelInput },
    applyFilters,
  };
}
