import { useState, useMemo } from 'react';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';

export interface UseSilencesFiltersResult {
  showInactive: boolean;
  setShowInactive: (show: boolean) => void;
  applyStateFilter: (silences: GettableSilence[]) => GettableSilence[];
}

export function useSilencesFilters(): UseSilencesFiltersResult {
  const [showInactive, setShowInactive] = useState(false);

  const applyStateFilter = useMemo(
    () => (silences: GettableSilence[]) => {
      return silences.filter(
        (silence) => showInactive || silence.status.state === 'active' || silence.status.state === 'pending'
      );
    },
    [showInactive]
  );

  return { showInactive, setShowInactive, applyStateFilter };
}
