/**
 * MSW handlers for Mimir Alertmanager API endpoints
 *
 * Mimir has specific behavior for its alertmanager API:
 * 1. Configuration is fetched via GET /api/v1/alerts (not the typical alertmanager endpoint)
 * 2. Configuration is returned as YAML (not JSON)
 * 3. Updates are sent via POST /api/v1/alerts with Content-Type: application/yaml
 */

import { http, HttpResponse } from 'msw';
import { stringify as stringifyYaml } from 'yaml';
import { YamlToParsedUserConfiguration, ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import { basicConfig } from '../fixtures/alertmanager-config';

/**
 * Default configuration returned by the GET handler
 * Tests can override this with server.use() for specific scenarios
 */
let currentConfig: ParsedUserConfiguration = basicConfig;

/**
 * The configuration document as YAML text, when a test has set one.
 *
 * Tests that care about the raw document use this instead of `currentConfig`, because encoding a
 * parsed configuration back to YAML reformats it, which loses exactly what those tests are about:
 * comments, key order and quoting.
 */
let currentRawConfig: string | undefined;

/**
 * Reset the configuration state to default
 * Called in afterEach via resetRulerState in vitest-setup.ts
 */
export function resetMimirAlertmanagerState() {
  currentConfig = basicConfig;
  currentRawConfig = undefined;
}

/**
 * Set the current configuration for the next request
 * Useful for tests that need to set up specific configuration state
 */
export function setMimirAlertmanagerConfig(config: ParsedUserConfiguration) {
  currentConfig = config;
  currentRawConfig = undefined;
}

/** Serves this exact YAML document, so a test can assert what survives a round trip. */
export function setMimirAlertmanagerRawConfig(document: string) {
  currentRawConfig = document;
}

/** Returns the document the last POST stored, as it was received. */
export function getMimirAlertmanagerRawConfig() {
  return currentRawConfig;
}

export const mimirAlertmanagerHandlers = [
  /**
   * GET /alertmanager/api/v2/status - the Alertmanager's own view of what it is running
   *
   * Mimir serves the Alertmanager v2 API under an `alertmanager/api` prefix, which is why this is a
   * separate handler from the vanilla one. The real endpoint reports the configuration re-marshalled
   * by the Alertmanager, with defaults filled in and secrets replaced by `<secret>`; this stands in
   * for it with the stored configuration, which is enough for tests that only need it to render.
   */
  http.get('/api/datasources/proxy/uid/:uid/alertmanager/api/v2/status', () => {
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
        original: stringifyYaml(currentConfig.alertmanager_config),
      },
    });
  }),

  /**
   * GET /api/v1/alerts - Get Mimir Alertmanager user configuration
   *
   * Returns configuration as YAML string (not JSON)
   * URL pattern matches: /api/datasources/proxy/uid/:uid/api/v1/alerts
   */
  http.get('/api/datasources/proxy/uid/:uid/api/v1/alerts', () => {
    // Encode the configuration object to YAML format, unless a test gave us a document to serve
    const yamlConfig = currentRawConfig ?? YamlToParsedUserConfiguration.encode(currentConfig);

    return HttpResponse.text(yamlConfig, {
      status: 200,
      headers: {
        'Content-Type': 'application/yaml',
      },
    });
  }),

  /**
   * POST /api/v1/alerts - Update Mimir Alertmanager user configuration
   *
   * Accepts YAML configuration and returns success response
   * URL pattern matches: /api/datasources/proxy/uid/:uid/api/v1/alerts
   */
  http.post('/api/datasources/proxy/uid/:uid/api/v1/alerts', async ({ request }) => {
    // Verify Content-Type header
    const contentType = request.headers.get('Content-Type');
    if (contentType !== 'application/yaml') {
      return HttpResponse.json({ error: 'Content-Type must be application/yaml' }, { status: 400 });
    }

    // Parse the YAML body to validate it's valid configuration
    const yamlBody = await request.text();
    try {
      const parsedConfig = YamlToParsedUserConfiguration.decode(yamlBody);
      // Update the current config for subsequent GET requests, keeping the document as it arrived
      // so tests can assert on the bytes that were sent
      currentConfig = parsedConfig;
      currentRawConfig = yamlBody;
    } catch (error) {
      return HttpResponse.json({ error: 'Invalid YAML configuration' }, { status: 400 });
    }

    // Mimir returns a simple success response (not the full config)
    return HttpResponse.json({ status: 'success' }, { status: 200 });
  }),
];
