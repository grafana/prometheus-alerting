import { renderHook, waitFor } from '@testing-library/react';
import { setDataSourceSrv } from '@grafana/runtime';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockAlertmanagerDs } from '../../../test/fixtures/datasources';
import { createMockDataSourceSrv, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { server } from '../../../test/server';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useAlertGroups } from './useAlertGroups';

function requireDataSourceUID(dataSource: { uid?: string }): string {
  if (!dataSource.uid) {
    throw new Error('Expected the test data source to have a UID');
  }

  return dataSource.uid;
}

const alertmanagerUID = requireDataSourceUID(mockAlertmanagerDs);

describe('useAlertGroups', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('skips the alert-instances request when requested by the caller', async () => {
    const getAlertGroups = vi.fn(() => HttpResponse.json([]));
    server.use(http.get('/api/datasources/proxy/uid/:uid/api/v2/alerts/groups', getAlertGroups));

    const { result } = renderHook(() => useAlertGroups({ skip: true }), {
      wrapper: createTestWrapper(alertmanagerUID),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getAlertGroups).not.toHaveBeenCalled();
  });

  it('requests alert instances when the query is not skipped', async () => {
    const getAlertGroups = vi.fn(() => HttpResponse.json([]));
    server.use(http.get('/api/datasources/proxy/uid/:uid/api/v2/alerts/groups', getAlertGroups));

    const { result } = renderHook(() => useAlertGroups(), {
      wrapper: createTestWrapper(alertmanagerUID),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getAlertGroups).toHaveBeenCalledOnce();
    expect(result.current.alertGroups).toEqual([]);
  });
});
