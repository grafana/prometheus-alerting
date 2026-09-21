import { useState, useMemo, useCallback } from 'react';

import { PromAlert, PromAlertState } from '@grafana/external-rules/vanilla';

export type StateFilterOption = 'all' | PromAlertState;

export interface InstancesFilterState {
  searchText: string;
  stateFilter: StateFilterOption;
}

export interface StateCount {
  all: number;
  firing: number;
  pending: number;
}

export interface UseInstancesFilterResult {
  /** Current filter state */
  filterState: InstancesFilterState;
  /** Filtered alerts based on current filters */
  filteredAlerts: PromAlert[];
  /** Count of alerts by state */
  stateCounts: StateCount;
  /** Set the search text filter */
  setSearchText: (text: string) => void;
  /** Set the state filter */
  setStateFilter: (state: StateFilterOption) => void;
  /** Clear all filters */
  clearFilters: () => void;
}

/**
 * Hook to manage filtering of alert instances
 */
export function useInstancesFilter(alerts: PromAlert[]): UseInstancesFilterResult {
  const [filterState, setFilterState] = useState<InstancesFilterState>({
    searchText: '',
    stateFilter: 'all',
  });

  // Calculate state counts from unfiltered alerts
  const stateCounts = useMemo<StateCount>(() => {
    return alerts.reduce(
      (counts, alert) => {
        counts.all++;
        if (alert.state === 'firing') {
          counts.firing++;
        } else if (alert.state === 'pending') {
          counts.pending++;
        }
        return counts;
      },
      { all: 0, firing: 0, pending: 0 }
    );
  }, [alerts]);

  // Filter alerts based on current filter state
  const filteredAlerts = useMemo(() => {
    const searchText = filterState.searchText.trim().toLowerCase();

    return alerts.filter((alert) => {
      // State filter
      if (filterState.stateFilter !== 'all' && alert.state !== filterState.stateFilter) {
        return false;
      }

      // Label search filter
      if (searchText) {
        const matchesLabel = Object.entries(alert.labels).some(([key, value]) => {
          const keyLower = key.toLowerCase();
          const valueLower = value.toLowerCase();
          return (
            keyLower.includes(searchText) ||
            valueLower.includes(searchText) ||
            `${keyLower}=${valueLower}`.includes(searchText)
          );
        });
        if (!matchesLabel) {
          return false;
        }
      }

      return true;
    });
  }, [alerts, filterState]);

  const setSearchText = useCallback((text: string) => {
    setFilterState((prev) => ({ ...prev, searchText: text }));
  }, []);

  const setStateFilter = useCallback((state: StateFilterOption) => {
    setFilterState((prev) => ({ ...prev, stateFilter: state }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({ searchText: '', stateFilter: 'all' });
  }, []);

  return {
    filterState,
    filteredAlerts,
    stateCounts,
    setSearchText,
    setStateFilter,
    clearFilters,
  };
}
