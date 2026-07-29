/**
 * Mocks for @grafana/runtime that can't be handled by MSW.
 * These are for synchronous config/service lookups that don't make HTTP requests.
 */

import { CurrentUser, OrgRole } from '@grafana/data';
import { config, DataSourceSrv, setCurrentUser } from '@grafana/runtime';

import {
  DataSourceInstanceSettingsFactory,
  mockDatasourcesConfig,
  mockAlertmanagerDs,
  mockMimirDs,
  mockPrometheusDs,
} from '../fixtures/datasources';

/**
 * Mock implementation of getDataSourceSrv().getInstanceSettings()
 * Returns mock datasource settings by UID
 */
export function createMockDataSourceSrv(): DataSourceSrv {
  const dataSources = Object.values(mockDatasourcesConfig).map((settings) =>
    DataSourceInstanceSettingsFactory.build(settings)
  );

  const getInstanceSettings: DataSourceSrv['getInstanceSettings'] = (ref) => {
    const uidOrName = typeof ref === 'string' ? ref : ref?.uid;
    return dataSources.find((dataSource) => dataSource.uid === uidOrName || dataSource.name === uidOrName);
  };

  return {
    get: async () => {
      throw new Error('Data source instances are not available in this test mock');
    },
    getInstanceSettings,
    getList: (filters) => {
      if (!filters?.type) {
        return dataSources;
      }

      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      return dataSources.filter((dataSource) => types.includes(dataSource.type));
    },
    reload: async () => {},
    registerRuntimeDataSource: () => {},
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

const mockCurrentUser = {
  isSignedIn: true,
  id: 1,
  uid: 'test-user',
  externalUserId: '',
  login: 'test-user',
  email: 'test-user@example.com',
  name: 'Test User',
  theme: 'dark',
  orgCount: 1,
  orgId: 1,
  orgName: 'Main Org.',
  orgRole: OrgRole.Admin,
  isGrafanaAdmin: false,
  gravatarUrl: '',
  timezone: 'browser',
  weekStart: '',
  language: 'en-US',
  permissions: {},
  analytics: { identifier: 'test-user' },
  authenticatedBy: 'password',
} satisfies CurrentUser;

let originalDatasources: typeof config.datasources;

/**
 * Set up Grafana runtime mocks.
 * Call this in beforeAll or at the top of jest-setup.
 */
export function setupGrafanaRuntimeMocks() {
  originalDatasources = config.datasources;

  // Apply mocks
  (config as any).datasources = mockDatasourcesConfig;
  setCurrentUser(mockCurrentUser);
}

/**
 * Reset Grafana runtime mocks to original state.
 * Call this in afterEach to ensure test isolation.
 */
export function resetGrafanaRuntimeMocks() {
  (config as any).datasources = originalDatasources;
  mockCurrentUser.permissions = {};
}

export function setCurrentUserPermissions(...permissions: string[]) {
  mockCurrentUser.permissions = Object.fromEntries(permissions.map((permission) => [permission, true]));
}

/**
 * Re-export mock datasources for convenience
 */
export { mockAlertmanagerDs, mockMimirDs, mockPrometheusDs };
