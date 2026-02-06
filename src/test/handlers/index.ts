/**
 * Combines all MSW handlers for the test server.
 * Add new handler arrays here as they're created.
 */

import { http, HttpResponse } from 'msw';
import { rulerHandlers } from './ruler';
import { prometheusHandlers } from './prometheus';
import { featureDiscoveryHandlers } from './feature-discovery';
import { datasourcesHandlers } from './datasources';
import { alertmanagerHandlers } from './alertmanager';
import { mimirAlertmanagerHandlers } from './mimir-alertmanager';

/**
 * Catch-all handler to prevent ECONNREFUSED errors from unhandled requests.
 * This should be last in the handlers array so it doesn't override specific handlers.
 * Returns empty responses for any requests that aren't handled by other handlers.
 */
const catchAllHandlers = [
  http.get('http://localhost:3000/*', () => {
    return new HttpResponse(null, { status: 404 });
  }),
];

export const allHandlers = [
  ...rulerHandlers,
  ...prometheusHandlers,
  ...featureDiscoveryHandlers,
  ...datasourcesHandlers,
  ...alertmanagerHandlers,
  ...mimirAlertmanagerHandlers,
  ...catchAllHandlers,
];
