import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppEvents } from '@grafana/data';

import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setCurrentUserPermissions, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useAddRoute } from './useAddRoute';
import { useDeleteRoute } from './useDeleteRoute';
import { useUpdateRoute } from './useUpdateRoute';

const mocks = vi.hoisted(() => ({
  produceConfiguration: vi.fn(),
  publish: vi.fn(),
  refetchRoutes: vi.fn(),
}));

vi.mock('@grafana/runtime', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@grafana/runtime')>();

  return {
    ...actual,
    getAppEvents: () => ({ publish: mocks.publish }),
  };
});

vi.mock('../../../hooks/useProduceNewAlertmanagerConfiguration', () => ({
  useProduceNewAlertmanagerConfiguration: () => [mocks.produceConfiguration, { isLoading: false }],
}));

vi.mock('./useRoutes', () => ({
  useRoutes: () => ({ refetch: mocks.refetchRoutes }),
}));

describe('route mutation permission guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockGrafanaDataSources();
    setCurrentUserPermissions();
  });

  it('does not produce a configuration when adding a route is denied', async () => {
    const { result } = renderHook(() => useAddRoute(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await act(async () => {
      expect(await result.current.addRoute('root', {}, 'child')).toBe(false);
    });

    expect(mocks.produceConfiguration).not.toHaveBeenCalled();
    expect(mocks.publish).toHaveBeenCalledWith({
      type: AppEvents.alertError.name,
      payload: ['Permission denied', 'You do not have permission to change routes for this data source.'],
    });
  });

  it('does not produce a configuration when updating a route is denied', async () => {
    const { result } = renderHook(() => useUpdateRoute(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await act(async () => {
      expect(await result.current.updateRoute('route-1', {})).toBe(false);
    });

    expect(mocks.produceConfiguration).not.toHaveBeenCalled();
    expect(mocks.publish).toHaveBeenCalledWith({
      type: AppEvents.alertError.name,
      payload: ['Permission denied', 'You do not have permission to change routes for this data source.'],
    });
  });

  it('does not produce a configuration when deleting a route is denied', async () => {
    const { result } = renderHook(() => useDeleteRoute(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await act(async () => {
      expect(await result.current.deleteRoute('route-1')).toBe(false);
    });

    expect(mocks.produceConfiguration).not.toHaveBeenCalled();
    expect(mocks.publish).toHaveBeenCalledWith({
      type: AppEvents.alertError.name,
      payload: ['Permission denied', 'You do not have permission to change routes for this data source.'],
    });
  });
});
