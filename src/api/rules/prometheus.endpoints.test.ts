import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse, JsonBodyType } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';

import { server } from '../../test';
import { createMockDataSourceSrv } from '../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../test/utils/test-wrapper';

import { prometheusApi } from './prometheus.endpoints';

const { useGetGroupsQuery } = prometheusApi;

const UID = 'test-mimir-uid';

function respondWith(body: JsonBodyType) {
  server.use(http.get(`/api/datasources/proxy/uid/${UID}/api/v1/rules`, () => HttpResponse.json(body)));
}

function renderGetGroups() {
  const { result } = renderHook(() => useGetGroupsQuery({ ruleSource: { uid: UID } }), {
    wrapper: createTestWrapper(UID),
  });

  return result;
}

describe('getGroups', () => {
  beforeEach(() => {
    // The Prometheus URL builder resolves the data source type to pick the API base path
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('fails the request when the response is not a Prometheus rules API response', async () => {
    respondWith({ status: 'success', data: {} });

    const result = renderGetGroups();

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual({
      status: 'CUSTOM_ERROR',
      error: expect.stringMatching(/does not match the Prometheus rules API \(data\.groups: .+\)$/),
      url: expect.stringContaining(`/api/datasources/proxy/uid/${UID}/api/v1/rules`),
    });
  });

  it('accepts alerting rules without a state, they are filled in as inactive', async () => {
    respondWith({
      status: 'success',
      data: {
        groups: [
          {
            name: 'group',
            file: 'namespace',
            interval: 60,
            rules: [{ type: 'alerting', name: 'rule', query: 'up == 0', health: 'ok' }],
          },
        ],
      },
    });

    const result = renderGetGroups();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.groups[0].rules[0]).toMatchObject({ state: 'inactive' });
  });
});
