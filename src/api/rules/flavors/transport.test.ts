import { setBackendSrv } from '@grafana/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';

import { restoreMockBackendSrv } from '../../../test/mocks/backend-srv';

import { createRulerTransport } from './transport';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockReturnValue(of({ ok: true, status: 200, data: { hello: 'world' } }));
  setBackendSrv({ fetch: fetchMock } as any);
});

// These tests swap in a stub so they can assert on the request options. Put the shared mock back
// so the replacement doesn't outlive them.
afterEach(restoreMockBackendSrv);

describe('createRulerTransport', () => {
  it('issues the request under the data source proxy prefix', async () => {
    const transport = createRulerTransport('my-ds');

    await transport({ segments: ['config', 'v1', 'rules', 'my namespace'] });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/datasources/proxy/uid/my-ds/config/v1/rules/my%20namespace',
        method: 'GET',
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
  });

  it('returns the response body', async () => {
    const transport = createRulerTransport('my-ds');

    await expect(transport({ segments: ['api', 'v1', 'rules'] })).resolves.toEqual({ hello: 'world' });
  });

  it('forwards method, params, headers, and body', async () => {
    const transport = createRulerTransport('my-ds');

    await transport({
      method: 'POST',
      segments: ['config', 'v1', 'rules', 'ns'],
      params: { dry_run: 'true' },
      headers: { 'Content-Type': 'application/yaml' },
      body: 'name: group\n',
      responseType: 'text',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        params: { dry_run: 'true' },
        headers: { 'Content-Type': 'application/yaml' },
        data: 'name: group\n',
        responseType: 'text',
      })
    );
  });

  // A segment containing `/` would be sent unencoded and could escape the proxy prefix -- see the
  // security contract on buildDatasourceProxyUrl.
  it('refuses a segment that would escape the proxy prefix', async () => {
    const transport = createRulerTransport('my-ds');

    await expect(transport({ segments: ['config/v1/rules', '../../../admin/settings'] })).rejects.toThrow(
      'Path segment must not contain "/": config/v1/rules'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when the response is not ok', async () => {
    fetchMock.mockReturnValue(of({ ok: false, status: 404, data: { message: 'not found' } }));
    const transport = createRulerTransport('my-ds');

    await expect(transport({ segments: ['api', 'v1', 'rules'] })).rejects.toMatchObject({ status: 404 });
  });
});
