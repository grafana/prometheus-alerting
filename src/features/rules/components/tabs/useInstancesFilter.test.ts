import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from '@rstest/core';

import { PromAlert } from '@grafana/external-rules/vanilla';

import { useInstancesFilter } from './useInstancesFilter';

const createAlert = (state: 'firing' | 'pending', labels: Record<string, string>): PromAlert => ({
  state,
  labels,
  annotations: {},
  activeAt: new Date().toISOString(),
  value: '1',
});

describe('useInstancesFilter', () => {
  const mockAlerts: PromAlert[] = [
    createAlert('firing', { alertname: 'HighCPU', severity: 'critical', team: 'platform' }),
    createAlert('firing', { alertname: 'HighMemory', severity: 'warning', team: 'platform' }),
    createAlert('pending', { alertname: 'DiskFull', severity: 'critical', team: 'infra' }),
    createAlert('pending', { alertname: 'NetworkLatency', severity: 'warning', team: 'network' }),
  ];

  it('should initialize with default filter state', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    expect(result.current.filterState).toEqual({
      searchText: '',
      stateFilter: 'all',
    });
    expect(result.current.filteredAlerts).toHaveLength(4);
  });

  it('should calculate correct state counts', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    expect(result.current.stateCounts).toEqual({
      all: 4,
      firing: 2,
      pending: 2,
    });
  });

  it('should filter by firing state', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setStateFilter('firing');
    });

    expect(result.current.filteredAlerts).toHaveLength(2);
    expect(result.current.filteredAlerts.every((a) => a.state === 'firing')).toBe(true);
  });

  it('should filter by pending state', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setStateFilter('pending');
    });

    expect(result.current.filteredAlerts).toHaveLength(2);
    expect(result.current.filteredAlerts.every((a) => a.state === 'pending')).toBe(true);
  });

  it('should filter by label key', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setSearchText('severity');
    });

    // All alerts have severity label
    expect(result.current.filteredAlerts).toHaveLength(4);
  });

  it('should filter by label value', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setSearchText('critical');
    });

    expect(result.current.filteredAlerts).toHaveLength(2);
    expect(result.current.filteredAlerts.every((a) => a.labels.severity === 'critical')).toBe(true);
  });

  it('should filter by label key and value', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setSearchText('severity=critical');
    });

    expect(result.current.filteredAlerts).toHaveLength(2);
    expect(result.current.filteredAlerts.every((alert) => alert.labels.severity === 'critical')).toBe(true);
  });

  it('should filter by alertname value', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setSearchText('HighCPU');
    });

    expect(result.current.filteredAlerts).toHaveLength(1);
    expect(result.current.filteredAlerts[0].labels.alertname).toBe('HighCPU');
  });

  it('should combine state and search filters', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setStateFilter('firing');
      result.current.setSearchText('critical');
    });

    // Only firing alerts with critical severity
    expect(result.current.filteredAlerts).toHaveLength(1);
    expect(result.current.filteredAlerts[0].labels.alertname).toBe('HighCPU');
  });

  it('should be case insensitive for search', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setSearchText('HIGHCPU');
    });

    expect(result.current.filteredAlerts).toHaveLength(1);
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setStateFilter('firing');
      result.current.setSearchText('critical');
    });

    expect(result.current.filteredAlerts).toHaveLength(1);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filterState).toEqual({
      searchText: '',
      stateFilter: 'all',
    });
    expect(result.current.filteredAlerts).toHaveLength(4);
  });

  it('should handle empty alerts array', () => {
    const { result } = renderHook(() => useInstancesFilter([]));

    expect(result.current.stateCounts).toEqual({
      all: 0,
      firing: 0,
      pending: 0,
    });
    expect(result.current.filteredAlerts).toHaveLength(0);
  });

  it('should trim search text whitespace', () => {
    const { result } = renderHook(() => useInstancesFilter(mockAlerts));

    act(() => {
      result.current.setSearchText('   ');
    });

    // Empty/whitespace search should show all
    expect(result.current.filteredAlerts).toHaveLength(4);
  });
});
