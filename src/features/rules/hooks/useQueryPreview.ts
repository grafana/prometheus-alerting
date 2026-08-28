import { useCallback, useState } from 'react';
import { catchError, lastValueFrom, map, of, throwError } from 'rxjs';

import {
  CoreApp,
  dateTime,
  FieldType,
  toDataFrame,
  type DataFrame,
  type DataQueryRequest,
  type DataQueryResponse,
} from '@grafana/data';
import { getBackendSrv, isFetchError, toDataQueryResponse, type BackendDataSourceResponse } from '@grafana/runtime';
import { getDataSourceInstanceSettings } from '@grafana/runtime/unstable';
import type { DataQuery } from '@grafana/schema';

import { extractErrorMessage } from '../../../utils/errors';

export interface QueryPreviewResult {
  labels: Record<string, string>;
  value: string;
  timestamp: number;
}

export interface QueryPreviewState {
  results: QueryPreviewResult[];
  isLoading: boolean;
  error: string | null;
  resultType: 'vector' | 'matrix' | 'scalar' | 'string' | null;
  hasRun: boolean;
}

interface InstantQuery extends DataQuery {
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
    app: CoreApp.Unknown,
    startTime: Date.now(),
  } satisfies DataQueryRequest<InstantQuery>;
}

function getResponseError(response: DataQueryResponse): unknown {
  return response.errors?.[0] ?? response.error;
}

function frameToResults(frame: DataFrame): QueryPreviewResult[] {
  const valueField = frame.fields.find((field) => field.type !== FieldType.time);
  if (!valueField) {
    return [];
  }

  const timeField = frame.fields.find((field) => field.type === FieldType.time);
  const labels = valueField.labels ?? {};
  const results: QueryPreviewResult[] = [];

  for (let index = 0; index < frame.length; index++) {
    const value = valueField.values[index];
    if (value === null || value === undefined) {
      continue;
    }

    const timestamp = timeField?.values[index];
    results.push({
      labels,
      value: String(value),
      timestamp: typeof timestamp === 'number' ? timestamp / 1000 : Date.now() / 1000,
    });
  }

  return results;
}

function responseToResults(response: DataQueryResponse): QueryPreviewResult[] {
  return response.data.flatMap((data) => frameToResults(toDataFrame(data)));
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
        const dataSource = await getDataSourceInstanceSettings(dataSourceUid);
        if (!dataSource) {
          throw new Error(`Data source with uid "${dataSourceUid}" not found`);
        }

        const request = createInstantQueryRequest(dataSourceUid, dataSource.type, expression);
        const response = await lastValueFrom(
          getBackendSrv()
            .fetch<BackendDataSourceResponse>({
              url: `/api/ds/query?ds_type=${encodeURIComponent(dataSource.type)}&requestId=${encodeURIComponent(request.requestId)}`,
              method: 'POST',
              data: {
                queries: request.targets.map((target) => ({
                  ...target,
                  intervalMs: request.intervalMs,
                  maxDataPoints: request.maxDataPoints,
                })),
                from: request.range.from.valueOf().toString(),
                to: request.range.to.valueOf().toString(),
              },
              requestId: request.requestId,
              showErrorAlert: false,
              headers: {
                'X-Plugin-Id': dataSource.type,
                'X-Datasource-Uid': dataSourceUid,
              },
            })
            .pipe(
              map((rawResponse) => toDataQueryResponse(rawResponse, request.targets)),
              catchError((error: unknown) => {
                if (!isFetchError<BackendDataSourceResponse>(error)) {
                  return throwError(() => error);
                }

                return of(toDataQueryResponse(error, request.targets));
              })
            )
        );

        const responseError = getResponseError(response);

        if (responseError) {
          throw responseError;
        }

        const results = responseToResults(response);
        setState({
          results,
          isLoading: false,
          error: null,
          resultType: results.length > 0 ? 'vector' : null,
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
