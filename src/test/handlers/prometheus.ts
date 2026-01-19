/**
 * MSW handlers for Prometheus API endpoints.
 * These handle rule queries (read-only).
 */

import { http, HttpResponse } from 'msw';

/**
 * GET /api/prometheus/:dataSourceUid/api/v1/rules
 * Returns Prometheus-format rules (used for rule state/health)
 */
const getPrometheusRulesHandler = () =>
  http.get('/api/prometheus/:dataSourceUid/api/v1/rules', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        groups: [],
      },
    });
  });

/**
 * GET /api/prometheus/:dataSourceUid/api/v1/alerts
 * Returns active alerts
 */
const getPrometheusAlertsHandler = () =>
  http.get('/api/prometheus/:dataSourceUid/api/v1/alerts', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        alerts: [],
      },
    });
  });

export const prometheusHandlers = [getPrometheusRulesHandler(), getPrometheusAlertsHandler()];
