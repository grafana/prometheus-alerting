import { useState, useMemo } from 'react';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';

export interface SilencesFiltersState {
  showInactive: boolean;
}

export interface SilencesFiltersActions {
  setShowInactive: (show: boolean) => void;
}

export interface UseSilencesFiltersResult {
  filters: SilencesFiltersState;
  actions: SilencesFiltersActions;
  applyFilters: (silences: GettableSilence[]) => GettableSilence[];
}

export function useSilencesFilters(): UseSilencesFiltersResult {
  const [showInactive, setShowInactive] = useState(false);

  const applyFilters = useMemo(
    () => (silences: GettableSilence[]) => {
      if (showInactive) {
        return silences;
      }
      // Only show active and pending silences by default (hide expired)
      return silences.filter((silence) => silence.status.state === 'active' || silence.status.state === 'pending');
    },
    [showInactive]
  );

  return {
    filters: { showInactive },
    actions: { setShowInactive },
    applyFilters,
  };
}
