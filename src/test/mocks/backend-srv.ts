import { BackendSrv, setBackendSrv } from '@grafana/runtime';
import { from } from 'rxjs';

/**
 * A `BackendSrv` backed by the global `fetch`, so MSW handlers intercept it.
 *
 * Grafana's real implementation is not published, but plugin code talks to Grafana through
 * `getBackendSrv()` — including the rules-source flavor transport. This reproduces the parts the
 * plugin depends on: URL/param building, `responseType` handling, the `{ ok, status, data }`
 * response envelope, and rejection with a `{ status, data }` fetch error on a non-2xx response
 * (which is what `isNotFoundError` and `isForbiddenError` match on).
 */

interface FetchOptions {
  url: string;
  method?: string;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  data?: unknown;
  responseType?: 'json' | 'text' | 'arraybuffer' | 'blob';
}

function buildUrl({ url, params }: FetchOptions): string {
  const definedParams = Object.entries(params ?? {}).filter(([, value]) => value !== undefined && value !== null);

  if (definedParams.length === 0) {
    return url;
  }

  const search = new URLSearchParams(definedParams.map(([key, value]) => [key, String(value)]));
  return `${url}?${search.toString()}`;
}

function serializeBody(data: unknown): string | undefined {
  if (data === undefined || data === null) {
    return undefined;
  }

  return typeof data === 'string' ? data : JSON.stringify(data);
}

async function parseBody(response: Response, responseType: FetchOptions['responseType']) {
  const text = await response.text();

  if (responseType === 'text') {
    return text;
  }

  if (text === '') {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(options: FetchOptions) {
  const { method = 'GET', headers, data, responseType } = options;

  const response = await fetch(buildUrl(options), {
    method,
    headers,
    body: serializeBody(data),
  });

  const body = await parseBody(response, responseType);

  if (!response.ok) {
    // Matches the shape Grafana rejects with, so status-sensitive callers keep working.
    throw { status: response.status, statusText: response.statusText, data: body, config: options };
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data: body,
    headers: response.headers,
  };
}

export function createMockBackendSrv(): BackendSrv {
  // `fetch` is observable-based in Grafana; callers wrap it in `lastValueFrom`.
  const fetchImpl = (options: FetchOptions) => from(request(options));

  const withBody = (method: string) => async (url: string, data?: unknown, options?: Partial<FetchOptions>) =>
    (await request({ ...options, url, method, data })).data;

  const withoutBody = (method: string) => async (url: string, params?: Record<string, unknown>) =>
    (await request({ url, method, params })).data;

  return {
    fetch: fetchImpl,
    get: withoutBody('GET'),
    delete: withoutBody('DELETE'),
    post: withBody('POST'),
    put: withBody('PUT'),
    patch: withBody('PATCH'),
    request: async (options: FetchOptions) => (await request(options)).data,
  } as unknown as BackendSrv;
}

export function setupMockBackendSrv() {
  setBackendSrv(createMockBackendSrv());
}
