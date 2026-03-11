/**
 * Mocks for @grafana/runtime that can't be handled by MSW.
 * These are for synchronous config/service lookups that don't make HTTP requests.
 */

import { config, setDataSourceSrv } from '@grafana/runtime';

import { mockDatasourcesConfig, mockAlertmanagerDs, mockMimirDs, mockPrometheusDs } from '../fixtures/datasources';

/**
 * Mock implementation of getDataSourceSrv().getInstanceSettings()
 * Returns mock datasource settings by UID
 */
export function createMockDataSourceSrv() {
  return {
    getInstanceSettings: (uid: string) => {
      return mockDatasourcesConfig[uid] || null;
    },
    getList: () => {
      return Object.values(mockDatasourcesConfig);
    },
    get: (name: string) => {
      const ds = Object.values(mockDatasourcesConfig).find((d) => d.name === name);
      return ds || null;
    },
  };
}

/**
 * Mock Grafana runtime config with datasources
 */
export const mockGrafanaConfig = {
  datasources: mockDatasourcesConfig,
  bootData: {
    user: {
      isSignedIn: true,
      orgId: 1,
      orgName: 'Main Org.',
      name: 'Admin',
      login: 'admin',
      email: 'admin@localhost',
    },
  },
  appSubUrl: '',
  alertingEnabled: true,
  unifiedAlertingEnabled: true,
};

// Store original config values for reset
let originalDatasources: typeof config.datasources;

/**
 * Set up Grafana runtime mocks.
 * Call this in beforeAll or at the top of jest-setup.
 */
export function setupGrafanaRuntimeMocks() {
  // Store originals
  originalDatasources = config.datasources;

  // Apply mocks
  (config as any).datasources = mockDatasourcesConfig;
  setDataSourceSrv(createMockDataSourceSrv() as any);
}

/**
 * Reset Grafana runtime mocks to original state.
 * Call this in afterEach to ensure test isolation.
 */
export function resetGrafanaRuntimeMocks() {
  // Restore original config (if it was set)
  if (originalDatasources !== undefined) {
    (config as any).datasources = originalDatasources;
  }
}

/**
 * Re-export mock datasources for convenience
 */
export { mockAlertmanagerDs, mockMimirDs, mockPrometheusDs };
