/**
 * MSW handlers for Alertmanager API endpoints
 */

import { http, HttpResponse } from 'msw';
import { stringify as stringifyYaml } from 'yaml';
import type { ParsedAlertmanagerConfig } from '@grafana/external-alertmanager/vanilla';

/**
 * Default parsed config returned by GET /api/v2/status.
 * Tests can override this with setVanillaAlertmanagerConfig().
 */
const defaultParsedConfig: ParsedAlertmanagerConfig = {
  receivers: [{ name: 'default' }],
};

let currentParsedConfig: ParsedAlertmanagerConfig = defaultParsedConfig;

/**
 * Reset the vanilla Alertmanager config to default.
 * Call in afterEach for test isolation.
 */
export function resetVanillaAlertmanagerState() {
  currentParsedConfig = defaultParsedConfig;
}

/**
 * Set the alertmanager_config that GET /api/v2/status will return in config.parsed.
 * Useful for tests that need specific inhibit_rules, receivers, etc.
 */
export function setVanillaAlertmanagerConfig(config: ParsedAlertmanagerConfig) {
  currentParsedConfig = config;
}

export const alertmanagerHandlers = [
  // GET /api/v2/status
  http.get('/api/datasources/proxy/uid/:uid/api/v2/status', () => {
    return HttpResponse.json({
      uptime: '1h',
      cluster: { name: 'test-cluster', status: 'ready', peers: [] },
      versionInfo: {
        version: '0.26.0',
        revision: 'test',
        branch: 'main',
        buildUser: 'test-user',
        buildDate: '2024-01-01',
        goVersion: 'go1.21.0',
      },
      config: {
        // The getConfiguration endpoint transforms config.original (YAML) — not config.parsed.
        original: stringifyYaml(currentParsedConfig),
        parsed: currentParsedConfig,
      },
    });
  }),

  // GET /api/v2/alerts/groups
  http.get('/api/datasources/proxy/uid/:uid/api/v2/alerts/groups', () => {
    return HttpResponse.json([]);
  }),
];
