import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

import { AlertingAction, useScopedAbilities, useUnscopedAbilities } from './abilities';

const mockHasPermission = vi.fn();
const mockUseDiscoverFeaturesQuery = vi.fn();

vi.mock('@grafana/runtime', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
}));

vi.mock('../api/rules/featureDiscovery.endpoints', () => ({
  useDiscoverFeaturesQuery: (...args: unknown[]) => mockUseDiscoverFeaturesQuery(...args),
}));

describe('useScopedAbilities', () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
    mockHasPermission.mockReturnValue(true);
    mockUseDiscoverFeaturesQuery.mockReset();
    mockUseDiscoverFeaturesQuery.mockReturnValue({ data: undefined, isLoading: false });
  });

  it('marks rule changes unsupported when no data source has been selected', () => {
    const { result } = renderHook(() => useScopedAbilities(undefined));

    expect(result.current[AlertingAction.CreateRule]).toEqual({
      granted: false,
      cause: 'NOT_SUPPORTED',
    });
    expect(mockUseDiscoverFeaturesQuery).toHaveBeenCalledOnce();
  });

  it('reports loading while data source feature discovery is in progress', () => {
    mockUseDiscoverFeaturesQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useScopedAbilities('mimir'));

    expect(result.current[AlertingAction.UpdateRule]).toEqual({
      granted: false,
      cause: 'LOADING',
    });
  });

  it('includes the discovery error when data source capabilities cannot be determined', () => {
    const error = { status: 403, data: 'Access denied' };
    mockUseDiscoverFeaturesQuery.mockReturnValue({ data: undefined, isLoading: false, error });

    const { result } = renderHook(() => useScopedAbilities('mimir'));

    expect(result.current[AlertingAction.UpdateRule]).toEqual({
      granted: false,
      cause: 'ERROR',
      error,
    });
  });

  it('marks rule changes unsupported when the selected data source lacks a Ruler configuration API', () => {
    mockUseDiscoverFeaturesQuery.mockReturnValue({
      data: { application: 'prometheus', rulerApiEnabled: false },
      isLoading: false,
    });

    const { result } = renderHook(() => useScopedAbilities('read-only-prometheus'));

    expect(result.current[AlertingAction.UpdateRule]).toEqual({
      granted: false,
      cause: 'NOT_SUPPORTED',
    });
    expect(mockUseDiscoverFeaturesQuery).toHaveBeenCalledWith({ uid: 'read-only-prometheus' });
  });

  it('reports insufficient permissions after confirming data source support', () => {
    mockHasPermission.mockReturnValue(false);
    mockUseDiscoverFeaturesQuery.mockReturnValue({
      data: { application: 'mimir', rulerApiEnabled: true },
      isLoading: false,
    });

    const { result } = renderHook(() => useScopedAbilities('mimir'));

    expect(result.current[AlertingAction.UpdateRule]).toEqual({
      granted: false,
      cause: 'INSUFFICIENT_PERMISSIONS',
      anyOfPermissions: ['alert.rules.external:write'],
    });
  });

  it('grants rule changes when the data source supports Ruler and permission is granted', () => {
    mockUseDiscoverFeaturesQuery.mockReturnValue({
      data: { application: 'mimir', rulerApiEnabled: true },
      isLoading: false,
    });

    const { result } = renderHook(() => useScopedAbilities('mimir'));

    expect(result.current[AlertingAction.UpdateRule]).toEqual({ granted: true });
  });

  it('returns unscoped abilities without requiring a data source', () => {
    const { result } = renderHook(() => useUnscopedAbilities());

    expect(result.current[AlertingAction.ViewRules]).toEqual({ granted: true });
    expect(result.current[AlertingAction.CreateRule]).toEqual({ granted: true });
    expect(mockUseDiscoverFeaturesQuery).not.toHaveBeenCalled();
  });

  it('maps every unscoped action to its Grafana permission', () => {
    mockHasPermission.mockReturnValue(false);

    const { result } = renderHook(() => useUnscopedAbilities());

    expect(result.current).toEqual({
      [AlertingAction.ViewRules]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: ['alert.rules.external:read'],
      },
      [AlertingAction.CreateRule]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: ['alert.rules.external:write'],
      },
      [AlertingAction.SilenceRule]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: ['alert.instances.external:write'],
      },
      [AlertingAction.ViewInstances]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: ['alert.instances.external:read'],
      },
      [AlertingAction.UpdateInstances]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: ['alert.instances.external:write'],
      },
      [AlertingAction.ViewNotifications]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: ['alert.notifications.external:read'],
      },
      [AlertingAction.UpdateNotifications]: {
        granted: false,
        cause: 'INSUFFICIENT_PERMISSIONS',
        anyOfPermissions: ['alert.notifications.external:write'],
      },
    });
  });

  it('uses the unscoped create permission in the scoped create ability', () => {
    mockHasPermission.mockImplementation((permission: string) => permission !== 'alert.rules.external:write');
    mockUseDiscoverFeaturesQuery.mockReturnValue({
      data: { application: 'mimir', rulerApiEnabled: true },
      isLoading: false,
    });

    const { result } = renderHook(() => useScopedAbilities('mimir'));

    expect(result.current[AlertingAction.CreateRule]).toEqual({
      granted: false,
      cause: 'INSUFFICIENT_PERMISSIONS',
      anyOfPermissions: ['alert.rules.external:write'],
    });
  });
});
