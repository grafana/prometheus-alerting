/**
 * MSW handlers for Mimir Alertmanager API endpoints
 *
 * Mimir has specific behavior for its alertmanager API:
 * 1. Configuration is fetched via GET /api/v1/alerts (not the typical alertmanager endpoint)
 * 2. Configuration is returned as YAML (not JSON)
 * 3. Updates are sent via POST /api/v1/alerts with Content-Type: application/yaml
 */

import { http, HttpResponse } from 'msw';
import { YamlToParsedUserConfiguration, ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import { basicConfig } from '../fixtures/alertmanager-config';

/**
 * Default configuration returned by the GET handler
 * Tests can override this with server.use() for specific scenarios
 */
let currentConfig: ParsedUserConfiguration = basicConfig;

/**
 * Reset the configuration state to default
 * Called in afterEach via resetRulerState in vitest-setup.ts
 */
export function resetMimirAlertmanagerState() {
  currentConfig = basicConfig;
}

/**
 * Set the current configuration for the next request
 * Useful for tests that need to set up specific configuration state
 */
export function setMimirAlertmanagerConfig(config: ParsedUserConfiguration) {
  currentConfig = config;
}

export const mimirAlertmanagerHandlers = [
  /**
   * GET /api/v1/alerts - Get Mimir Alertmanager user configuration
   *
   * Returns configuration as YAML string (not JSON)
   * URL pattern matches: /api/datasources/proxy/uid/:uid/api/v1/alerts
   */
  http.get('/api/datasources/proxy/uid/:uid/api/v1/alerts', () => {
    // Encode the configuration object to YAML format
    const yamlConfig = YamlToParsedUserConfiguration.encode(currentConfig);

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
      // Update the current config for subsequent GET requests
      currentConfig = parsedConfig;
    } catch (error) {
      return HttpResponse.json({ error: 'Invalid YAML configuration' }, { status: 400 });
    }

    // Mimir returns a simple success response (not the full config)
    return HttpResponse.json({ status: 'success' }, { status: 200 });
  }),
];
