/**
 * MSW handlers for Prometheus API endpoints.
 * These handle rule queries (read-only).
 */

import { http, HttpResponse } from 'msw';

const getPrometheusRulesHandler = () =>
  http.get('/api/datasources/proxy/uid/:dataSourceUid/api/v1/rules', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        groups: [],
      },
    });
  });

const getLokiRulesHandler = () =>
  http.get('/api/datasources/proxy/uid/:dataSourceUid/api/prom/rules', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        groups: [],
      },
    });
  });

export const prometheusHandlers = [
  getPrometheusRulesHandler(),
  getLokiRulesHandler(),
];
