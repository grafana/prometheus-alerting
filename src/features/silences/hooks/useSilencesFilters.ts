import { useState, useMemo } from 'react';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';

import { formatMatchers } from '../utils/silences.utils';

export interface SilencesFiltersState {
  showInactive: boolean;
  matcherInput: string;
}

export interface SilencesFiltersActions {
  setShowInactive: (show: boolean) => void;
  setMatcherInput: (input: string) => void;
}

export interface UseSilencesFiltersResult {
  filters: SilencesFiltersState;
  actions: SilencesFiltersActions;
  applyFilters: (silences: GettableSilence[]) => GettableSilence[];
}

function silenceMatchesInput(silence: GettableSilence, input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) {
    return true;
  }
  return formatMatchers(silence).some((matcher) => {
    const normalized = matcher.toLowerCase();
    return normalized.includes(trimmed) || normalized.replace(/"/g, '').includes(trimmed);
  });
}

export function useSilencesFilters(): UseSilencesFiltersResult {
  const [showInactive, setShowInactive] = useState(false);
  const [matcherInput, setMatcherInput] = useState('');

  const applyFilters = useMemo(
    () => (silences: GettableSilence[]) => {
      return silences
        .filter((silence) => showInactive || silence.status.state === 'active' || silence.status.state === 'pending')
        .filter((silence) => silenceMatchesInput(silence, matcherInput));
    },
    [showInactive, matcherInput]
  );

  return {
    filters: { showInactive, matcherInput },
    actions: { setShowInactive, setMatcherInput },
    applyFilters,
  };
}
