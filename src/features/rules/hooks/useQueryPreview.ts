import { useCallback, useState } from 'react';
import { from, lastValueFrom } from 'rxjs';

import {
  CoreApp,
  dateTime,
  FieldType,
  toDataFrame,
  type DataFrame,
  type DataQueryRequest,
  type DataQueryResponse,
} from '@grafana/data';
import { getDataSourceInstance } from '@grafana/runtime/unstable';
import type { DataQuery } from '@grafana/schema';

import { extractErrorMessage } from '../../../utils/errors';

export interface QueryPreviewResult {
  labels: Record<string, string>;
  value: string;
  /** Epoch milliseconds, matching the time field of the returned data frame. */
  timestamp: number;
}

const RESULT_TYPES = ['vector', 'matrix', 'scalar', 'string'] as const;

export type QueryPreviewResultType = (typeof RESULT_TYPES)[number];

export interface QueryPreviewState {
  results: QueryPreviewResult[];
  isLoading: boolean;
  error: string | null;
  resultType: QueryPreviewResultType | null;
  hasRun: boolean;
}

interface InstantExpressionQuery extends DataQuery {
  expr: string;
  instant: true;
  range: false;
  queryType: 'instant';
}

function createInstantQueryRequest(dataSourceUid: string, dataSourceType: string, expression: string) {
  const now = dateTime();

  return {
    requestId: `query-preview-${dataSourceUid}`,
    interval: '1s',
    intervalMs: 1000,
    maxDataPoints: 1,
    range: { from: now, to: now, raw: { from: 'now', to: 'now' } },
    scopedVars: {},
    targets: [
      {
        refId: 'A',
        datasource: { uid: dataSourceUid, type: dataSourceType },
        expr: expression,
        instant: true,
        range: false,
        queryType: 'instant',
      },
    ],
    timezone: 'browser',
    app: CoreApp.CloudAlerting,
    startTime: Date.now(),
  } satisfies DataQueryRequest<InstantExpressionQuery>;
}

function getQueryResponseError(response: DataQueryResponse): unknown {
  return response.errors?.[0];
}

/**
 * A frame can hold one series per numeric field, so every numeric field is a series of its own.
 * Reading only the first one would silently hide the rest of the query result.
 */
function dataFrameToPreviewResults(frame: DataFrame): QueryPreviewResult[] {
  const timeField = frame.fields.find((field) => field.type === FieldType.time);

  return frame.fields
    .filter((field) => field.type === FieldType.number)
    .flatMap((valueField) => {
      const labels = valueField.labels ?? {};
      const results: QueryPreviewResult[] = [];

      for (let index = 0; index < frame.length; index++) {
        const value = valueField.values[index];
        if (typeof value !== 'number') {
          continue;
        }

        const timestamp = timeField?.values[index];
        results.push({
          labels,
          value: String(value),
          timestamp: typeof timestamp === 'number' ? timestamp : Date.now(),
        });
      }

      return results;
    });
}

function isResultType(value: unknown): value is QueryPreviewResultType {
  return RESULT_TYPES.some((resultType) => resultType === value);
}

/**
 * Data sources such as Prometheus report the Prometheus result type on the frame, so prefer that.
 * Otherwise fall back to the frame shape: more than one sample per series means a range result.
 */
function getResultType(frames: DataFrame[]): QueryPreviewResultType {
  for (const frame of frames) {
    const reportedResultType: unknown = frame.meta?.custom?.resultType;
    if (isResultType(reportedResultType)) {
      return reportedResultType;
    }
  }

  return frames.some((frame) => frame.length > 1) ? 'matrix' : 'vector';
}

export function useQueryPreview(dataSourceUid: string) {
  const [state, setState] = useState<QueryPreviewState>({
    results: [],
    isLoading: false,
    error: null,
    resultType: null,
    hasRun: false,
  });

  const runQuery = useCallback(
    async (expression: string) => {
      if (!expression.trim()) {
        setState({
          results: [],
          isLoading: false,
          error: 'Expression is empty',
          resultType: null,
          hasRun: true,
        });
        return;
      }

      setState((previousState) => ({ ...previousState, isLoading: true, error: null }));

      try {
        // Use the datasource query API instead of its proxy endpoint. This keeps long expressions in
        // a POST body and lets both Prometheus and Loki use Grafana's standard backend query transport.
        const dataSource = await getDataSourceInstance(dataSourceUid);
        const request = createInstantQueryRequest(dataSourceUid, dataSource.type, expression);
        const response = await lastValueFrom(from(dataSource.query(request)));

        const responseError = getQueryResponseError(response);

        if (responseError) {
          throw responseError;
        }

        const frames = response.data.map((data) => toDataFrame(data));
        const results = frames.flatMap(dataFrameToPreviewResults);
        setState({
          results,
          isLoading: false,
          error: null,
          resultType: results.length > 0 ? getResultType(frames) : null,
          hasRun: true,
        });
      } catch (error) {
        setState({
          results: [],
          isLoading: false,
          error: extractErrorMessage(error),
          resultType: null,
          hasRun: true,
        });
      }
    },
    [dataSourceUid]
  );

  const clearResults = useCallback(() => {
    setState({
      results: [],
      isLoading: false,
      error: null,
      resultType: null,
      hasRun: false,
    });
  }, []);

  return {
    ...state,
    runQuery,
    clearResults,
  };
}
