/**
 * Combines all MSW handlers for the test server.
 * Add new handler arrays here as they're created.
 */

import { rulerHandlers } from './ruler';
import { prometheusHandlers } from './prometheus';
import { featureDiscoveryHandlers } from './feature-discovery';
import { datasourcesHandlers } from './datasources';

export const allHandlers = [
  ...rulerHandlers,
  ...prometheusHandlers,
  ...featureDiscoveryHandlers,
  ...datasourcesHandlers,
];
