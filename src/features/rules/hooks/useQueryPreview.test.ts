import { act, renderHook } from '@testing-library/react';
import { CoreApp, FieldType, toDataFrame, type DataQueryResponse } from '@grafana/data';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useQueryPreview } from './useQueryPreview';

const mockQuery = vi.fn();
const mockGetDataSource = vi.fn();

vi.mock('@grafana/runtime/unstable', () => ({
  getDataSourceInstance: (...args: unknown[]) => mockGetDataSource(...args),
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

function arrangeQueryResponse(response: DataQueryResponse) {
  mockQuery.mockReturnValue(of(response));
}

describe('useQueryPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDataSource.mockResolvedValue({ type: 'prometheus', query: mockQuery });
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
    expect(mockGetDataSource).not.toHaveBeenCalled();
  });

  it('executes an instant query through the datasource API', async () => {
    mockGetDataSource.mockResolvedValue({ type: 'loki', query: mockQuery });
    arrangeQueryResponse(
      createDataFrameQueryResponse([
        { labels: { job: 'prometheus', instance: 'localhost:9090' }, value: 1 },
        { labels: { job: 'grafana', instance: 'localhost:3000' }, value: 42 },
      ])
    );
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('sum(rate({job="grafana"}[5m]))'));

    expect(mockGetDataSource).toHaveBeenCalledWith('test-ds-uid');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        app: CoreApp.CloudAlerting,
        targets: [
          expect.objectContaining({
            datasource: { uid: 'test-ds-uid', type: 'loki' },
            expr: 'sum(rate({job="grafana"}[5m]))',
            instant: true,
            range: false,
            queryType: 'instant',
          }),
        ],
      })
    );
    expect(result.current.results).toEqual([
      {
        labels: { job: 'prometheus', instance: 'localhost:9090' },
        value: '1',
        timestamp: 1234567890000,
      },
      {
        labels: { job: 'grafana', instance: 'localhost:3000' },
        value: '42',
        timestamp: 1234567890000,
      },
    ]);
    expect(result.current.resultType).toBe('vector');
    expect(result.current.hasRun).toBe(true);
  });

  it('reads every series of a frame that holds several value fields', async () => {
    arrangeQueryResponse({
      data: [
        toDataFrame({
          fields: [
            { name: 'Time', type: FieldType.time, values: [1234567890000] },
            { name: 'up{job="a"}', type: FieldType.number, labels: { job: 'a' }, values: [1] },
            { name: 'up{job="b"}', type: FieldType.number, labels: { job: 'b' }, values: [0] },
          ],
        }),
      ],
    });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('up'));

    expect(result.current.results).toEqual([
      { labels: { job: 'a' }, value: '1', timestamp: 1234567890000 },
      { labels: { job: 'b' }, value: '0', timestamp: 1234567890000 },
    ]);
    expect(result.current.resultType).toBe('vector');
  });

  it('skips samples that carry no numeric value', async () => {
    arrangeQueryResponse({
      data: [
        toDataFrame({
          fields: [
            { name: 'Time', type: FieldType.time, values: [1234567890000, 1234567950000] },
            { name: 'Value', type: FieldType.number, labels: { job: 'a' }, values: [null, 7] },
          ],
        }),
      ],
    });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('up'));

    expect(result.current.results).toEqual([{ labels: { job: 'a' }, value: '7', timestamp: 1234567950000 }]);
  });

  it('reports the result type the datasource put on the frame', async () => {
    const frame = toDataFrame({
      fields: [
        { name: 'Time', type: FieldType.time, values: [1234567890000] },
        { name: 'Value', type: FieldType.number, labels: {}, values: [1] },
      ],
    });
    frame.meta = { custom: { resultType: 'scalar' } };
    arrangeQueryResponse({ data: [frame] });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('scalar(up)'));

    expect(result.current.resultType).toBe('scalar');
  });

  it('infers a range result from frames with several samples', async () => {
    arrangeQueryResponse({
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
    arrangeQueryResponse({ data: [] });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('nonexistent_metric'));

    expect(result.current.results).toEqual([]);
    expect(result.current.resultType).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.hasRun).toBe(true);
  });

  it('surfaces converted datasource errors', async () => {
    arrangeQueryResponse({ data: [], errors: [{ message: 'parse error: unexpected token' }] });
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('invalid{'));

    expect(result.current.error).toBe('parse error: unexpected token');
    expect(result.current.hasRun).toBe(true);
  });

  it('surfaces datasource query failures', async () => {
    mockQuery.mockReturnValue(throwError(() => new Error('parse error: unexpected token')));
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));

    await act(() => result.current.runQuery('invalid{'));

    expect(result.current.error).toBe('parse error: unexpected token');
  });

  it('reports a missing datasource', async () => {
    mockGetDataSource.mockRejectedValue(new Error('Datasource missing was not found'));
    const { result } = renderHook(() => useQueryPreview('missing'));

    await act(() => result.current.runQuery('up'));

    expect(result.current.error).toBe('Datasource missing was not found');
  });

  it('clears preview state', async () => {
    arrangeQueryResponse(createDataFrameQueryResponse([{ labels: { job: 'test' }, value: 1 }]));
    const { result } = renderHook(() => useQueryPreview('test-ds-uid'));
    await act(() => result.current.runQuery('up'));

    act(() => result.current.clearResults());

    expect(result.current.results).toEqual([]);
    expect(result.current.hasRun).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
