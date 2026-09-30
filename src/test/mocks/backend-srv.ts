import { BackendSrv, BackendSrvRequest, FetchError, FetchResponse, setBackendSrv } from '@grafana/runtime';
import { from } from 'rxjs';

import { extractErrorMessage } from '../../utils/errors';

/**
 * A `BackendSrv` backed by the global `fetch`, so MSW handlers intercept it.
 *
 * Grafana's real implementation is not published, but plugin code talks to Grafana through
 * `getBackendSrv()` — including the rules-source flavor transport. The aim here is to behave
 * correctly for anything a plugin could reasonably call, not just the calls we happen to make
 * today, so that a test passing is good evidence the same call works in Grafana.
 *
 * What it reproduces: the real method signatures, URL and query-string building, request body
 * encoding, all four `responseType` values, the full `{ ok, status, data, ... }` response
 * envelope, rejection with a `FetchError` on a non-2xx response (which is what `isNotFoundError`
 * and `isForbiddenError` match on), `abortSignal`, and `credentials`.
 *
 * Options that are accepted and then ignored: `showSuccessAlert` and `showErrorAlert` (a test has
 * no notification area), `requestId` (which in Grafana cancels an earlier in-flight request with
 * the same id), `hideFromInspector` (no query inspector), and `retry` (every request is made once).
 *
 * `datasourceRequest()` and `chunked()` are implemented as stubs that throw if called — the
 * plugin doesn't use either (the first is deprecated, the second is for long-lived streaming
 * connections like the Kubernetes WATCH API), so there's nothing real to reproduce, but a call
 * to one should fail loudly in a test rather than silently doing nothing.
 *
 * Also missing: retrying once on a 401 to refresh the auth token, since there is no session to
 * refresh; `validatePath`, because the plugin does its own path checking in
 * `src/api/utils/proxyPath.ts`; and `traceId` on the response, since nothing here produces one.
 *
 * Where the real behaviour isn't published and we'd only be guessing, this does the plain thing
 * instead of inventing one. A network-level failure rejects with whatever `fetch` threw rather
 * than a made-up status code, for instance.
 */

/** Builds the request URL, appending query params when there are any. */
function buildUrl(url: string, params: BackendSrvRequest['params']): string {
  if (!params) {
    return url;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    // Grafana leaves out params that are `undefined` but keeps `null` ones (as the string "null").
    if (value === undefined) {
      continue;
    }

    // An array becomes one entry per item under the same key, e.g. `?match=a&match=b`. Joining
    // them into a single comma-separated value would be wrong.
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined) {
          search.append(key, String(item));
        }
      }
      continue;
    }

    search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

/** True for the body types `fetch` already knows how to send as-is. */
function isNativeBody(data: unknown): data is BodyInit {
  return (
    typeof data === 'string' ||
    data instanceof FormData ||
    data instanceof URLSearchParams ||
    data instanceof Blob ||
    data instanceof ArrayBuffer ||
    data instanceof ReadableStream ||
    ArrayBuffer.isView(data)
  );
}

/**
 * Turns `data` into something `fetch` accepts, and labels it as JSON when we had to encode it.
 * Mutates `headers` so the content type ends up on the request.
 */
function prepareBody(data: unknown, headers: Headers): BodyInit | undefined {
  if (data === undefined || data === null) {
    return undefined;
  }

  if (isNativeBody(data)) {
    return data;
  }

  // Grafana labels encoded bodies for you, unless you set your own content type.
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return JSON.stringify(data);
}

async function parseBody(response: Response, responseType: BackendSrvRequest['responseType']) {
  if (responseType === 'arraybuffer') {
    return response.arrayBuffer();
  }

  if (responseType === 'blob') {
    return response.blob();
  }

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

function resolveCredentials(options: BackendSrvRequest): RequestCredentials | undefined {
  if (options.credentials) {
    return options.credentials;
  }

  // `withCredentials` is deprecated in favour of `credentials`, but callers may still pass it.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return options.withCredentials ? 'include' : undefined;
}

function describeFailure(status: number, statusText: string, data: unknown): string {
  if (data === null || data === undefined || data === '') {
    return statusText || `Request failed with status ${status}`;
  }

  return extractErrorMessage({ data });
}

async function request<T>(options: BackendSrvRequest): Promise<FetchResponse<T>> {
  const { method = 'GET', responseType } = options;

  const headers = new Headers(options.headers);
  const body = prepareBody(options.data, headers);

  // A request that never reaches a server -- a dropped connection, or MSW's HttpResponse.error()
  // -- rejects with whatever `fetch` throws. We don't dress it up as an HTTP error, because it
  // isn't one.
  const response = await fetch(buildUrl(options.url, options.params), {
    method,
    headers,
    body,
    signal: options.abortSignal,
    credentials: resolveCredentials(options),
  });

  const data = await parseBody(response, responseType);

  if (!response.ok) {
    // Matches the shape Grafana rejects with, so status-sensitive callers keep working.
    const fetchError: FetchError = {
      status: response.status,
      statusText: response.statusText,
      data,
      message: describeFailure(response.status, response.statusText, data),
      config: options,
    };
    throw fetchError;
  }

  return {
    data: data as T,
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: response.headers,
    redirected: response.redirected,
    type: response.type,
    url: response.url,
    config: options,
  };
}

export function createMockBackendSrv(): BackendSrv {
  const backendSrv: BackendSrv = {
    async get<T>(url: string, params?: unknown, requestId?: string, options?: Partial<BackendSrvRequest>) {
      return (
        await request<T>({ ...options, url, params: params as BackendSrvRequest['params'], requestId, method: 'GET' })
      ).data;
    },

    // The second argument of `delete` is a request body, not query params — an easy one to get
    // backwards, and one that would send the body as a query string.
    async delete<T>(url: string, data?: unknown, options?: Partial<BackendSrvRequest>) {
      return (await request<T>({ ...options, url, data, method: 'DELETE' })).data;
    },

    async post<T>(url: string, data?: unknown, options?: Partial<BackendSrvRequest>) {
      return (await request<T>({ ...options, url, data, method: 'POST' })).data;
    },

    async put<T>(url: string, data?: unknown, options?: Partial<BackendSrvRequest>) {
      return (await request<T>({ ...options, url, data, method: 'PUT' })).data;
    },

    async patch<T>(url: string, data?: unknown, options?: Partial<BackendSrvRequest>) {
      return (await request<T>({ ...options, url, data, method: 'PATCH' })).data;
    },

    async request<T>(options: BackendSrvRequest) {
      return (await request<T>(options)).data;
    },

    // `fetch` is observable-based in Grafana; callers wrap it in `lastValueFrom`.
    fetch<T>(options: BackendSrvRequest) {
      return from(request<T>(options));
    },

    datasourceRequest() {
      throw new Error('datasourceRequest() is not implemented in the mock BackendSrv — use fetch() instead');
    },

    chunked() {
      throw new Error('chunked() is not implemented in the mock BackendSrv — the plugin has no streaming transport');
    },
  };

  return backendSrv;
}

export function setupMockBackendSrv() {
  setBackendSrv(createMockBackendSrv());
}

/**
 * Puts the shared mock back after a test has swapped in its own `BackendSrv`. Call this from an
 * `afterEach` so the replacement doesn't outlive the test that wanted it.
 */
export function restoreMockBackendSrv() {
  setupMockBackendSrv();
}
