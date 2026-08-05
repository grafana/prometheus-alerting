import { BackendSrv, setBackendSrv } from '@grafana/runtime';
import { of, throwError } from 'rxjs';

import { discoverDataSourceFeatures, errorIndicatesMissingRulerSupport } from './featureDiscovery';

vi.mock('@grafana/runtime/unstable', () => ({
  getDataSourceInstanceSettings: vi.fn(async () => ({ uid: 'prom', type: 'prometheus' })),
}));

interface StubResponse {
  status: number;
  statusText?: string;
  data?: unknown;
}

/** Minimal backendSrv stub – only `fetch` is exercised by feature discovery */
function stubBackendSrv(responses: Record<string, StubResponse>) {
  const fetch = ({ url }: { url: string }) => {
    const path = Object.keys(responses).find((candidate) => url.includes(candidate));
    const response = responses[path ?? ''] ?? { status: 404, data: { message: 'page not found' } };
    const ok = response.status >= 200 && response.status < 300;
    const payload = { ...response, ok, config: { url } };

    return ok ? of(payload) : throwError(() => payload);
  };

  // Neither the full BackendSrv surface nor a complete FetchResponse is relevant here,
  // feature discovery only reads the status and the body of a fetch
  setBackendSrv({ fetch } as unknown as BackendSrv);
}

describe('errorIndicatesMissingRulerSupport', () => {
  it.each(['GetRuleGroup unsupported in rule local store', 'page not found', 'ruler API is not enabled'])(
    'recognizes a Ruler API response containing "%s"',
    (message) => {
      expect(errorIndicatesMissingRulerSupport({ data: { message } })).toBe(true);
    }
  );

  it('recognizes a rules config endpoint 404', () => {
    expect(errorIndicatesMissingRulerSupport(new Error('404 from rules config endpoint'))).toBe(true);
  });

  it('does not classify unrelated errors as missing Ruler support', () => {
    expect(errorIndicatesMissingRulerSupport({ data: { message: 'Internal server error' } })).toBe(false);
  });
});

describe('discoverDataSourceFeatures', () => {
  it('propagates the rules request failure of a data source without buildinfo', async () => {
    stubBackendSrv({
      'status/buildinfo': { status: 404, data: { message: 'page not found' } },
      'api/v1/rules': {
        status: 502,
        statusText: 'Bad Gateway',
        data: { message: 'Bad Gateway', error: 'dial tcp 10.0.0.5:9090: connect: connection refused' },
      },
    });

    await expect(discoverDataSourceFeatures('prom')).rejects.toMatchObject({
      status: 502,
      statusText: 'Bad Gateway',
      data: { error: 'dial tcp 10.0.0.5:9090: connect: connection refused' },
      config: { url: expect.stringContaining('api/v1/rules') },
    });
  });

  it('detects a Cortex data source when the rules endpoint responds', async () => {
    stubBackendSrv({
      'status/buildinfo': { status: 404, data: { message: 'page not found' } },
      'api/v1/rules': { status: 200, data: { status: 'success', data: { groups: [] } } },
    });

    await expect(discoverDataSourceFeatures('prom')).resolves.toEqual({
      application: 'cortex',
      rulerApiEnabled: false,
    });
  });
});
