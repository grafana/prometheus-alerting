/**
 * MSW handlers for datasource feature discovery.
 * These determine what capabilities a datasource has.
 */

import { http, HttpResponse } from 'msw';

/**
 * GET /api/datasources/proxy/uid/:uid/api/v1/status/buildinfo
 * Returns build info for Prometheus/Mimir datasources
 * Used to discover supported features (ruler API, etc.)
 */
const getBuildInfoHandler = () =>
  http.get('/api/datasources/proxy/uid/:uid/api/v1/status/buildinfo', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        version: '2.45.0',
        revision: 'abc123',
        branch: 'HEAD',
        buildUser: 'root@localhost',
        buildDate: '20230101-00:00:00',
        goVersion: 'go1.20',
      },
    });
  });

/**
 * GET /api/datasources/proxy/uid/:uid/api/v1/status/config
 * Returns Prometheus/Mimir config (used for ruler detection)
 */
const getConfigHandler = () =>
  http.get('/api/datasources/proxy/uid/:uid/api/v1/status/config', () => {
    return HttpResponse.json({
      status: 'success',
      data: {
        yaml: 'ruler:\n  enable_api: true',
      },
    });
  });

export const featureDiscoveryHandlers = [getBuildInfoHandler(), getConfigHandler()];
