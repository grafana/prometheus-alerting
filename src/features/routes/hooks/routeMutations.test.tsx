import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, rs } from '@rstest/core';

import { AppEvents } from '@grafana/data';

import { PermissionDeniedError } from '../../../access-control/errors';
import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useAddRoute } from './useAddRoute';
import { useDeleteRoute } from './useDeleteRoute';
import { useUpdateRoute } from './useUpdateRoute';
import * as grafanaRuntimeActual from '@grafana/runtime' with { rstest: 'importActual' };

const mocks = rs.hoisted(() => ({
  produceConfiguration: rs.fn(),
  publish: rs.fn(),
  refetchRoutes: rs.fn(),
}));

rs.mock('@grafana/runtime', () => {
  const actual = grafanaRuntimeActual;

  return {
    ...actual,
    getAppEvents: () => ({ publish: mocks.publish }),
  };
});

rs.mock('../../../hooks/useProduceNewAlertmanagerConfiguration', () => ({
  useProduceNewAlertmanagerConfiguration: () => [mocks.produceConfiguration, { isLoading: false }],
}));

rs.mock('./useRoutes', () => ({
  useRoutes: () => ({ refetch: mocks.refetchRoutes }),
}));

describe('route mutation permission feedback', () => {
  beforeEach(() => {
    rs.clearAllMocks();
    setMockGrafanaDataSources();
    mocks.produceConfiguration.mockRejectedValue(new PermissionDeniedError('Insufficient permissions'));
  });

  it('shows permission feedback when adding a route is denied', async () => {
    const { result } = renderHook(() => useAddRoute(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await act(async () => {
      expect(await result.current.addRoute('root', {}, 'child')).toBe(false);
    });

    expect(mocks.produceConfiguration).toHaveBeenCalledOnce();
    expect(mocks.publish).toHaveBeenCalledWith({
      type: AppEvents.alertError.name,
      payload: ['Permission denied', 'You do not have permission to change routes for this data source.'],
    });
  });

  it('shows permission feedback when updating a route is denied', async () => {
    const { result } = renderHook(() => useUpdateRoute(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await act(async () => {
      expect(await result.current.updateRoute('route-1', {})).toBe(false);
    });

    expect(mocks.produceConfiguration).toHaveBeenCalledOnce();
    expect(mocks.publish).toHaveBeenCalledWith({
      type: AppEvents.alertError.name,
      payload: ['Permission denied', 'You do not have permission to change routes for this data source.'],
    });
  });

  it('shows permission feedback when deleting a route is denied', async () => {
    const { result } = renderHook(() => useDeleteRoute(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });

    await act(async () => {
      expect(await result.current.deleteRoute('route-1')).toBe(false);
    });

    expect(mocks.produceConfiguration).toHaveBeenCalledOnce();
    expect(mocks.publish).toHaveBeenCalledWith({
      type: AppEvents.alertError.name,
      payload: ['Permission denied', 'You do not have permission to change routes for this data source.'],
    });
  });
});
