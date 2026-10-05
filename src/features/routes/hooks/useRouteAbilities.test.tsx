import { renderHook } from '@testing-library/react';
import { beforeEach } from '@rstest/core';

import { AlertingPermission } from '../../../access-control/abilities';
import { RouteAction } from '../../../access-control/abilities.routes';
import { mockAlertmanagerDs, mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setCurrentUserPermissions, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useRouteAbilities } from './useRouteAbilities';

describe('useRouteAbilities', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
  });

  it('reports missing permissions before checking Alertmanager configuration support', () => {
    setCurrentUserPermissions();

    const { result } = renderHook(() => useRouteAbilities(), {
      wrapper: createTestWrapper(mockAlertmanagerDs.uid),
    });

    expect(result.current).toEqual({
      [RouteAction.ViewRoutes]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsRead],
      },
      [RouteAction.ViewInstances]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesRead],
      },
      [RouteAction.MutateRoutes]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsWrite],
      },
    });
  });

  it('marks route mutations unsupported for an authorized vanilla Alertmanager', () => {
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);

    const { result } = renderHook(() => useRouteAbilities(), {
      wrapper: createTestWrapper(mockAlertmanagerDs.uid),
    });

    expect(result.current[RouteAction.MutateRoutes]).toEqual({
      granted: false,
      cause: 'NOT_SUPPORTED',
    });
  });

  it('grants route and instance actions for an authorized Mimir Alertmanager', () => {
    setCurrentUserPermissions(
      AlertingPermission.NotificationsRead,
      AlertingPermission.NotificationsWrite,
      AlertingPermission.InstancesRead
    );

    const { result } = renderHook(() => useRouteAbilities(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    expect(result.current).toEqual({
      [RouteAction.ViewRoutes]: { granted: true },
      [RouteAction.ViewInstances]: { granted: true },
      [RouteAction.MutateRoutes]: { granted: true },
    });
  });
});
