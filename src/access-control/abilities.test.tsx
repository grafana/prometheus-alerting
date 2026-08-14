import { reloadDataSourceInstanceSettings } from '@grafana/runtime/unstable';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { DataSourceInstanceSettingsFactory } from '../test/fixtures/datasources';
import { server } from '../test/server';
import { setCurrentUserPermissions } from '../test/mocks/grafana-runtime';
import { createTestWrapper } from '../test/utils/test-wrapper';

import { AlertingAction, AlertingPermission, useScopedAbilities, useUnscopedAbilities } from './abilities';

const buildInfoUrl = '/api/datasources/proxy/uid/:uid/api/v1/status/buildinfo';
const mimirDataSource = DataSourceInstanceSettingsFactory.build({
  uid: 'test-mimir-uid',
  name: 'Test Mimir',
  type: 'prometheus',
});
const prometheusDataSource = DataSourceInstanceSettingsFactory.build({
  uid: 'prometheus-1',
  name: 'Prometheus',
  type: 'prometheus',
});

async function loadDataSourceSettings() {
  server.use(
    http.get('/api/frontend/settings', () =>
      HttpResponse.json({
        datasources: {
          [mimirDataSource.uid]: mimirDataSource,
          [prometheusDataSource.uid]: prometheusDataSource,
        },
        defaultDatasource: prometheusDataSource.name,
      })
    )
  );

  await reloadDataSourceInstanceSettings();
}

function mimirBuildInfoResponse() {
  return HttpResponse.json({
    status: 'success',
    data: {
      application: 'mimir',
      version: '2.17.0',
      features: {
        ruler_config_api: 'true',
      },
    },
  });
}

function mockMimirBuildInfo() {
  server.use(http.get(buildInfoUrl, mimirBuildInfoResponse));
}

describe('useScopedAbilities', () => {
  beforeAll(loadDataSourceSettings);

  beforeEach(() => {
    setCurrentUserPermissions(AlertingPermission.RulesWrite);
  });

  it('includes the discovery error when data source capabilities cannot be determined', async () => {
    server.use(http.get(buildInfoUrl, () => HttpResponse.error()));

    const { result } = renderHook(() => useScopedAbilities(mimirDataSource.uid), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current[AlertingAction.UpdateRule]).toMatchObject({
        granted: false,
        cause: 'ERROR',
      });
    });
  });

  it('marks rule changes unsupported when the selected data source lacks a Ruler configuration API', async () => {
    const { result } = renderHook(() => useScopedAbilities(prometheusDataSource.uid), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current[AlertingAction.UpdateRule]).toEqual({
        granted: false,
        cause: 'NOT_SUPPORTED',
      });
    });
  });

  it('reports insufficient permissions without probing data source support', () => {
    let buildInfoRequests = 0;
    server.use(
      http.get(buildInfoUrl, () => {
        buildInfoRequests += 1;
        return HttpResponse.error();
      })
    );
    setCurrentUserPermissions();

    const { result } = renderHook(() => useScopedAbilities(mimirDataSource.uid), {
      wrapper: createTestWrapper(),
    });

    expect(result.current[AlertingAction.UpdateRule]).toEqual({
      granted: false,
      cause: 'INSUFFICIENT_PERMISSIONS',
      anyOfPermissions: [AlertingPermission.RulesWrite],
    });
    expect(buildInfoRequests).toBe(0);
  });

  it('grants rule changes when the data source supports Ruler and permission is granted', async () => {
    mockMimirBuildInfo();

    const { result } = renderHook(() => useScopedAbilities(mimirDataSource.uid), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current[AlertingAction.UpdateRule]).toEqual({ granted: true });
    });
  });

  it('maps every unscoped action to its Grafana permission', () => {
    setCurrentUserPermissions();

    const { result } = renderHook(() => useUnscopedAbilities());

    expect(result.current).toEqual({
      [AlertingAction.ViewRules]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.RulesRead],
      },
      [AlertingAction.CreateRule]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.RulesWrite],
      },
      [AlertingAction.SilenceRule]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesWrite],
      },
      [AlertingAction.ViewInstances]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesRead],
      },
      [AlertingAction.UpdateInstances]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesWrite],
      },
      [AlertingAction.ViewNotifications]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsRead],
      },
      [AlertingAction.UpdateNotifications]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsWrite],
      },
    });
  });
});
