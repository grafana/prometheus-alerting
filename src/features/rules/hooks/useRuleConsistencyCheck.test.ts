import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';

import { useMatchingPromRuleExists, useRuleConsistencyCheck } from './useRuleConsistencyCheck';

// Mock the prometheus API
const mockFetchPrometheusGroups = vi.fn();

vi.mock('../../../api/rules/prometheus.endpoints', () => ({
  prometheusApi: {
    useLazyGetGroupsQuery: () => [mockFetchPrometheusGroups],
  },
}));

describe('useMatchingPromRuleExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockIdentifier: DataSourceRuleIdentifier = {
    type: 'cloud',
    uid: 'test-ds',
    namespace: 'test-namespace',
    groupName: 'test-group',
    ruleName: 'test-rule',
    rulerRuleHash: 'test-hash',
  };

  it('should return true when rule exists in Prometheus', async () => {
    mockFetchPrometheusGroups.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: {
            groups: [
              {
                file: 'test-namespace',
                name: 'test-group',
                rules: [{ name: 'test-rule', type: 'alerting' }],
              },
            ],
          },
        }),
    });

    const { result } = renderHook(() => useMatchingPromRuleExists());

    let exists: boolean | undefined;
    await act(async () => {
      exists = await result.current.matchingPromRuleExists(mockIdentifier);
    });

    expect(exists).toBe(true);
  });

  it('should return false when rule does not exist', async () => {
    mockFetchPrometheusGroups.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: {
            groups: [
              {
                file: 'test-namespace',
                name: 'test-group',
                rules: [{ name: 'other-rule', type: 'alerting' }],
              },
            ],
          },
        }),
    });

    const { result } = renderHook(() => useMatchingPromRuleExists());

    let exists: boolean | undefined;
    await act(async () => {
      exists = await result.current.matchingPromRuleExists(mockIdentifier);
    });

    expect(exists).toBe(false);
  });

  it('should return false when group does not exist', async () => {
    mockFetchPrometheusGroups.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: {
            groups: [],
          },
        }),
    });

    const { result } = renderHook(() => useMatchingPromRuleExists());

    let exists: boolean | undefined;
    await act(async () => {
      exists = await result.current.matchingPromRuleExists(mockIdentifier);
    });

    expect(exists).toBe(false);
  });

  it('should return false on API error', async () => {
    mockFetchPrometheusGroups.mockReturnValue({
      unwrap: () => Promise.reject(new Error('API error')),
    });

    const { result } = renderHook(() => useMatchingPromRuleExists());

    let exists: boolean | undefined;
    await act(async () => {
      exists = await result.current.matchingPromRuleExists(mockIdentifier);
    });

    expect(exists).toBe(false);
  });
});

describe('useRuleConsistencyCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockIdentifier: DataSourceRuleIdentifier = {
    type: 'cloud',
    uid: 'test-ds',
    namespace: 'test-namespace',
    groupName: 'test-group',
    ruleName: 'test-rule',
    rulerRuleHash: 'test-hash',
  };

  it('should resolve waitForRemoval after interval when rule does not exist', async () => {
    // Rule doesn't exist
    mockFetchPrometheusGroups.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { groups: [] } }),
    });

    const { result } = renderHook(() => useRuleConsistencyCheck());

    let resolved = false;
    act(() => {
      result.current.waitForRemoval(mockIdentifier).then(() => {
        resolved = true;
      });
    });

    // Advance past the first interval check (3 seconds)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(resolved).toBe(true);
    expect(mockFetchPrometheusGroups).toHaveBeenCalled();
  });

  it('should resolve waitForCreation after interval when rule exists', async () => {
    // Rule exists
    mockFetchPrometheusGroups.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          data: {
            groups: [
              {
                file: 'test-namespace',
                name: 'test-group',
                rules: [{ name: 'test-rule', type: 'alerting' }],
              },
            ],
          },
        }),
    });

    const { result } = renderHook(() => useRuleConsistencyCheck());

    let resolved = false;
    act(() => {
      result.current.waitForCreation(mockIdentifier).then(() => {
        resolved = true;
      });
    });

    // Advance past the first interval check (3 seconds)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(resolved).toBe(true);
    expect(mockFetchPrometheusGroups).toHaveBeenCalled();
  });
});
