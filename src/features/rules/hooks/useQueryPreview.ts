import { useCallback, useState } from 'react';

import { getBackendSrv } from '@grafana/runtime';

import { resolveFlavorOrThrow } from '../../../api/rules/flavors/registry';
import { buildDatasourceProxyUrl } from '../../../api/utils/proxyPath';
import { extractErrorMessage } from '../../../utils/errors';

/**
 * Prometheus instant query result types
 */
export interface PrometheusMetric {
  [key: string]: string;
}

export interface PrometheusVectorResult {
  metric: PrometheusMetric;
  value: [number, string]; // [timestamp, value]
}

export interface PrometheusMatrixResult {
  metric: PrometheusMetric;
  values: Array<[number, string]>; // array of [timestamp, value]
}

export interface PrometheusQueryResponse {
  status: 'success' | 'error';
  data: {
    resultType: 'vector' | 'matrix' | 'scalar' | 'string';
    result: PrometheusVectorResult[] | PrometheusMatrixResult[];
  };
  error?: string;
  errorType?: string;
}

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
  /** Whether a query has been executed (to distinguish "not run yet" from "no data") */
  hasRun: boolean;
}

/**
 * Hook to execute instant queries against Prometheus/Loki datasources
 * and preview the results.
 */
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

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const now = Math.floor(Date.now() / 1000);

        // Execute instant query via datasource proxy
        // GET is accepted by both Prometheus and Loki datasource proxies.
        const queryApiPath = (await resolveFlavorOrThrow(dataSourceUid)).queryPath;
        const response = await getBackendSrv().get<PrometheusQueryResponse>(
          buildDatasourceProxyUrl(dataSourceUid, ...queryApiPath.split('/')),
          { query: expression, time: now }
        );

        if (response.status === 'error') {
          throw new Error(response.error || 'Query failed');
        }

        const { resultType, result } = response.data;

        // Convert results to our format
        const results: QueryPreviewResult[] = [];

        if (resultType === 'vector') {
          const vectorResults = result as PrometheusVectorResult[];
          for (const item of vectorResults) {
            results.push({
              labels: item.metric,
              value: item.value[1],
              timestamp: item.value[0],
            });
          }
        } else if (resultType === 'matrix') {
          const matrixResults = result as PrometheusMatrixResult[];
          for (const item of matrixResults) {
            // For matrix, take the latest value
            const latestValue = item.values[item.values.length - 1];
            if (latestValue) {
              results.push({
                labels: item.metric,
                value: latestValue[1],
                timestamp: latestValue[0],
              });
            }
          }
        }

        setState({
          results,
          isLoading: false,
          error: null,
          resultType,
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
