import { act, renderHook } from '@testing-library/react';
import { FieldType, toDataFrame, type DataQueryResponse } from '@grafana/data';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQueryPreview } from './useQueryPreview';

const mockFetch = vi.fn();
const mockGetDataSourceInstanceSettings = vi.fn();
const mockIsFetchError = vi.fn();
const mockToDataQueryResponse = vi.fn();

vi.mock('@grafana/runtime', () => ({
  getBackendSrv: () => ({ fetch: mockFetch }),
  isFetchError: (...args: unknown[]) => mockIsFetchError(...args),
  toDataQueryResponse: (...args: unknown[]) => mockToDataQueryResponse(...args),
}));

vi.mock('@grafana/runtime/unstable', () => ({
  getDataSourceInstanceSettings: (...args: unknown[]) => mockGetDataSourceInstanceSettings(...args),
}));

function createDataFrameQueryResponse(
  series: Array<{ labels: Record<string, string>; value: number; timestamp?: number }>
): DataQueryResponse {
  return {
    data: series.map(({ labels, value, timestamp = 1234567890000 }) =>
      toDataFrame({
        fields: [
          { name: 'Time', type: FieldType.time, values: [timestamp] },
          { name: 'Metric', type: FieldType.string, values: ['ignored'] },
          { name: 'Value', type: FieldType.number, labels, values: [value] },
        ],
      })
    ),
  };
}

function arrangeConvertedQueryResponse(response: DataQueryResponse) {
  const backendResponse = { data: { results: {} } };
  mockFetch.mockReturnValue(of(backendResponse));
  mockToDataQueryResponse.mockReturnValue(response);
  return backendResponse;
}

describe('useQueryPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDataSourceInstanceSettings.mockResolvedValue({ type: 'prometheus' });
    mockIsFetchError.mockReturnValue(false);
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    expect(result.current).toMatchObject({
      results: [],
      isLoading: false,
      error: null,
      resultType: null,
      hasRun: false,
    });
  });

  it('rejects an empty expression without loading the datasource', async () => {
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('   '));

    expect(result.current.error).toBe('Expression is empty');
    expect(result.current.hasRun).toBe(true);
    expect(mockGetDataSourceInstanceSettings).not.toHaveBeenCalled();
  });

  it('executes an instant query through Grafana backend query API', async () => {
    mockGetDataSourceInstanceSettings.mockResolvedValue({ type: 'loki' });
    const backendResponse = arrangeConvertedQueryResponse(
      createDataFrameQueryResponse([
        { labels: { job: 'prometheus', instance: 'localhost:9090' }, value: 1 },
        { labels: { job: 'grafana', instance: 'localhost:3000' }, value: 42 },
      ])
    );
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('sum(rate({job="grafana"}[5m]))'));

    expect(mockGetDataSourceInstanceSettings).toHaveBeenCalledWith('test-ds-uid');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/ds/query?ds_type=loki&requestId=query-preview-test-ds-uid',
        method: 'POST',
        showErrorAlert: false,
        headers: {
          'X-Plugin-Id': 'loki',
          'X-Datasource-Uid': 'test-ds-uid',
        },
        data: expect.objectContaining({
          queries: [
            expect.objectContaining({
              datasource: { uid: 'test-ds-uid', type: 'loki' },
              expr: 'sum(rate({job="grafana"}[5m]))',
              instant: true,
              range: false,
              queryType: 'instant',
            }),
          ],
        }),
      })
    );
    expect(mockToDataQueryResponse).toHaveBeenCalledWith(
      backendResponse,
      expect.arrayContaining([expect.objectContaining({ refId: 'A' })])
    );
    expect(result.current.results).toEqual([
      {
        labels: { job: 'prometheus', instance: 'localhost:9090' },
        value: '1',
        timestamp: 1234567890,
      },
      {
        labels: { job: 'grafana', instance: 'localhost:3000' },
        value: '42',
        timestamp: 1234567890,
      },
    ]);
    expect(result.current.resultType).toBe('vector');
    expect(result.current.hasRun).toBe(true);
  });

  it('reports the result type the datasource put on the frame', async () => {
    const frame = toDataFrame({
      fields: [
        { name: 'Time', type: FieldType.time, values: [1234567890000] },
        { name: 'Value', type: FieldType.number, labels: {}, values: [1] },
      ],
    });
    frame.meta = { custom: { resultType: 'scalar' } };
    arrangeConvertedQueryResponse({ data: [frame] });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('scalar(up)'));

    expect(result.current.resultType).toBe('scalar');
  });

  it('infers a range result from frames with several samples', async () => {
    arrangeConvertedQueryResponse({
      data: [
        toDataFrame({
          fields: [
            { name: 'Time', type: FieldType.time, values: [1234567890000, 1234567950000] },
            { name: 'Value', type: FieldType.number, labels: { job: 'prometheus' }, values: [1, 2] },
          ],
        }),
      ],
    });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('up'));

    expect(result.current.resultType).toBe('matrix');
  });

  it('reports an empty converted response', async () => {
    arrangeConvertedQueryResponse({ data: [] });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('nonexistent_metric'));

    expect(result.current.results).toEqual([]);
    expect(result.current.resultType).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.hasRun).toBe(true);
  });

  it('surfaces converted datasource errors', async () => {
    arrangeConvertedQueryResponse({ data: [], errors: [{ message: 'parse error: unexpected token' }] });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('invalid{'));

    expect(result.current.error).toBe('parse error: unexpected token');
    expect(result.current.hasRun).toBe(true);
  });

  it('passes failed fetch responses to the query response converter', async () => {
    const backendFetchError = {
      status: 400,
      data: { results: { A: { error: 'parse error: unexpected token' } } },
    };
    mockFetch.mockReturnValue(throwError(() => backendFetchError));
    mockIsFetchError.mockReturnValue(true);
    mockToDataQueryResponse.mockReturnValue({
      data: [],
      errors: [{ message: 'parse error: unexpected token' }],
    });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('invalid{'));

    expect(mockIsFetchError).toHaveBeenCalledWith(backendFetchError);
    expect(mockToDataQueryResponse).toHaveBeenCalledWith(
      backendFetchError,
      expect.arrayContaining([expect.objectContaining({ refId: 'A' })])
    );
    expect(result.current.error).toBe('parse error: unexpected token');
  });

  it('surfaces non-fetch query failures', async () => {
    mockFetch.mockReturnValue(throwError(() => new Error('Data source unavailable')));
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('up'));

    expect(result.current.error).toBe('Data source unavailable');
    expect(result.current.hasRun).toBe(true);
  });

  it('reports a missing datasource', async () => {
    mockGetDataSourceInstanceSettings.mockResolvedValue(undefined);
    const { result } = renderHook(() => useQueryPreview('missing'));

    await act(() => result.current.runQuery('up'));

    expect(result.current.error).toBe('Data source with uid "missing" not found');
  });

  it('clears preview state', async () => {
    arrangeConvertedQueryResponse(createDataFrameQueryResponse([{ labels: { job: 'test' }, value: 1 }]));
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));
    await act(() => result.current.runQuery('up'));

    act(() => result.current.clearResults());

    expect(result.current.results).toEqual([]);
    expect(result.current.hasRun).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
