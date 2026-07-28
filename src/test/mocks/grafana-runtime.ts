/**
 * Mocks for @grafana/runtime that can't be handled by MSW.
 * These are for synchronous config/service lookups that don't make HTTP requests.
 */

import { firstValueFrom } from 'rxjs';
import { MockBackendSrv } from '@grafana/api-clients';
import { CurrentUser, OrgRole } from '@grafana/data';
import {
  BackendSrv,
  config,
  DataSourceSrv,
  setBackendSrv,
  setCurrentUser,
  setDataSourceSrv,
} from '@grafana/runtime';
import { reloadDataSourceInstanceSettings } from '@grafana/runtime/unstable';

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

class MockBackendSrvWithGet extends MockBackendSrv {
  async get<T>(url: string): Promise<T> {
    return (await firstValueFrom(this.fetch<T>({ url }))).data;
  }
}

/**
 * Set up Grafana runtime mocks.
 * Call this in beforeAll or at the top of jest-setup.
 */
export function setupGrafanaRuntimeMocks() {
  originalDatasources = config.datasources;

  // Apply mocks
  (config as any).datasources = mockDatasourcesConfig;
  setDataSourceSrv(createMockDataSourceSrv() as any);
  setBackendSrv(new MockBackendSrvWithGet() as BackendSrv);
  setCurrentUser(mockCurrentUser);
}

export async function loadMockDataSourceSettings() {
  // Exercise the real runtime reload path against the MSW /api/frontend/settings
  // handler instead of delegating to the legacy DataSourceSrv singleton.
  setDataSourceSrv(undefined as unknown as DataSourceSrv);
  await reloadDataSourceInstanceSettings();
  setDataSourceSrv(createMockDataSourceSrv() as any);
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
