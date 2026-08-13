import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { useQueryPreview } from './useQueryPreview';

// Mock getBackendSrv
const mockPost = vi.fn();

// The query path comes from the data source's flavor, so the registry needs a data source srv.
// Returning no settings exercises the fallback to the Prometheus query path.
vi.mock('@grafana/runtime', () => ({
  getBackendSrv: () => ({ post: mockPost }),
  getDataSourceSrv: () => ({ getInstanceSettings: () => undefined }),
}));

describe('useQueryPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    expect(result.current.results).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.resultType).toBeNull();
    expect(result.current.hasRun).toBe(false);
  });

  it('should set error for empty expression', async () => {
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(async () => {
      await result.current.runQuery('   ');
    });

    expect(result.current.error).toBe('Expression is empty');
    expect(result.current.hasRun).toBe(true);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('should execute query and parse vector results', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        resultType: 'vector',
        result: [
          {
            metric: { job: 'prometheus', instance: 'localhost:9090' },
            value: [1234567890, '1'],
          },
          {
            metric: { job: 'grafana', instance: 'localhost:3000' },
            value: [1234567890, '42'],
          },
        ],
      },
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(async () => {
      await result.current.runQuery('up');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toHaveLength(2);
    expect(result.current.results[0]).toEqual({
      labels: { job: 'prometheus', instance: 'localhost:9090' },
      value: '1',
      timestamp: 1234567890,
    });
    expect(result.current.resultType).toBe('vector');
    expect(result.current.hasRun).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle empty results', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        resultType: 'vector',
        result: [],
      },
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(async () => {
      await result.current.runQuery('nonexistent_metric');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.results).toHaveLength(0);
    expect(result.current.hasRun).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should handle API error response', async () => {
    const mockResponse = {
      status: 'error',
      error: 'invalid query syntax',
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(async () => {
      await result.current.runQuery('invalid{');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('invalid query syntax');
    expect(result.current.hasRun).toBe(true);
  });

  it('should handle network error', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(async () => {
      await result.current.runQuery('up');
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.hasRun).toBe(true);
  });

  it('should clear results', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        resultType: 'vector',
        result: [{ metric: { job: 'test' }, value: [123, '1'] }],
      },
    };

    mockPost.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    // Run a query first
    await act(async () => {
      await result.current.runQuery('up');
    });

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
    });

    // Clear results
    act(() => {
      result.current.clearResults();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.hasRun).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should send form-encoded data to Prometheus API', async () => {
    mockPost.mockResolvedValue({
      status: 'success',
      data: { resultType: 'vector', result: [] },
    });

    const { result } = renderHook(() => useQueryPreview('my-ds-uid'));

    await act(async () => {
      await result.current.runQuery('up{job="test"}');
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/api/datasources/proxy/uid/my-ds-uid/api/v1/query',
      expect.stringContaining('query=up%7Bjob%3D%22test%22%7D'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
  });
});
