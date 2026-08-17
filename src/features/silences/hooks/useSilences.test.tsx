import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { setDataSourceSrv } from '@grafana/runtime';

import { AlertingPermission } from '../../../access-control/abilities';
import { PermissionDeniedError } from '../../../access-control/errors';
import { server } from '../../../test';
import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { useCreateSilence, useDeleteSilence } from './useSilences';

describe('silence mutation permissions', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setCurrentUserPermissions(AlertingPermission.InstancesRead);
  });

  it('rejects creating a silence without instance write permissions', async () => {
    const { result } = renderHook(() => useCreateSilence(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });
    const [createSilence] = result.current;

    await expect(createSilence({ matchers: [], startsAt: '', endsAt: '', createdBy: '', comment: '' })).rejects.toThrow(
      PermissionDeniedError
    );
  });

  it('rejects expiring a silence without instance write permissions', async () => {
    const { result } = renderHook(() => useDeleteSilence(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });
    const [expireSilence] = result.current;

    await expect(expireSilence('silence-1')).rejects.toThrow(PermissionDeniedError);
  });
});

describe('silence id path safety', () => {
  afterEach(() => {
    server.events.removeAllListeners();
  });

  it('keeps a hostile silence id inside the datasource proxy', async () => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.InstancesWrite); // unlike the cases above

    const requested: string[] = [];
    server.events.on('request:start', ({ request }) => {
      requested.push(new URL(request.url).pathname);
    });

    // No real Alertmanager would have a silence at this id - respond 404 like the real one
    // would, just without MSW's "no matching handler" warning cluttering the test output.
    server.use(
      http.delete('/api/datasources/proxy/uid/:uid/alertmanager/api/v2/silence/:id', () =>
        HttpResponse.json(null, { status: 404 })
      )
    );

    const { result } = renderHook(() => useDeleteSilence(), {
      wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
    });
    const [expireSilence] = result.current;

    // the id a malicious or compromised Alertmanager could return
    await act(async () => {
      await expireSilence('../../../../../../../../api/admin/users/1').catch(() => {});
    });

    expect(requested.every((path) => path.startsWith('/api/datasources/proxy/uid/'))).toBe(true);
  });
});
