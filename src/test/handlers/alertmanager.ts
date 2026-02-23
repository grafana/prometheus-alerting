/**
 * MSW handlers for Alertmanager API endpoints
 */

import { http, HttpResponse } from 'msw';

/**
 * Mock Alertmanager status response
 */
const mockStatus = {
  uptime: '1h',
  cluster: {
    name: 'test-cluster',
    status: 'ready',
    peers: [],
  },
  versionInfo: {
    version: '0.26.0',
    revision: 'test',
    branch: 'main',
    buildUser: 'test-user',
    buildDate: '2024-01-01',
    goVersion: 'go1.21.0',
  },
  config: {
    original: 'route:\n  receiver: default',
    parsed: {
      receivers: [{ name: 'default' }],
    },
  },
};

export const alertmanagerHandlers = [
  // GET /api/v2/status
  http.get('/api/datasources/proxy/uid/:uid/api/v2/status', () => {
    return HttpResponse.json(mockStatus);
  }),

  // GET /api/v2/alerts/groups
  http.get('/api/datasources/proxy/uid/:uid/api/v2/alerts/groups', () => {
    return HttpResponse.json([]);
  }),
];
