import { renderHook } from '@testing-library/react';
import { beforeEach } from 'vitest';

import { AlertingAction, AlertingPermission } from '../../../access-control/abilities';
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
      wrapper: createTestWrapper('alertmanager-1'),
    });

    expect(result.current).toEqual({
      [AlertingAction.ViewNotifications]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsRead],
      },
      [AlertingAction.ViewInstances]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.InstancesRead],
      },
      [AlertingAction.CreateRoute]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsWrite],
      },
      [AlertingAction.UpdateRoute]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsWrite],
      },
      [AlertingAction.DeleteRoute]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: [AlertingPermission.NotificationsWrite],
      },
    });
  });

  it('marks route mutations unsupported for an authorized vanilla Alertmanager', () => {
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);

    const { result } = renderHook(() => useRouteAbilities(), {
      wrapper: createTestWrapper('alertmanager-1'),
    });

    expect(result.current[AlertingAction.CreateRoute]).toEqual({
      granted: false,
      cause: 'NOT_SUPPORTED',
    });
    expect(result.current[AlertingAction.UpdateRoute]).toEqual({
      granted: false,
      cause: 'NOT_SUPPORTED',
    });
    expect(result.current[AlertingAction.DeleteRoute]).toEqual({
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
      wrapper: createTestWrapper('mimir-alertmanager-1'),
    });

    expect(result.current).toEqual({
      [AlertingAction.ViewNotifications]: { granted: true },
      [AlertingAction.ViewInstances]: { granted: true },
      [AlertingAction.CreateRoute]: { granted: true },
      [AlertingAction.UpdateRoute]: { granted: true },
      [AlertingAction.DeleteRoute]: { granted: true },
    });
  });
});
