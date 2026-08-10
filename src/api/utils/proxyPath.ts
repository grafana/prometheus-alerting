const DATASOURCE_PROXY_PREFIX = '/api/datasources/proxy/uid';

/**
 * Builds a path relative to the `/api/datasources/proxy/uid` prefix, percent-encoding
 * every segment (including the datasource UID). Use this for RTK Query endpoints whose
 * `baseUrl` is already `/api/datasources/proxy/uid`.
 *
 * Response-supplied values (e.g. a silence ID echoed back by an Alertmanager) must never
 * be interpolated into this path unencoded — an unencoded `../` segment can escape the
 * proxy prefix and reach an arbitrary Grafana API with the caller's session.
 *
 * Each argument is one path segment and must not itself contain `/`; split any
 * multi-part static path (e.g. `config/v1/rules`) before passing it in.
 */
export function buildDatasourceProxyPath(dataSourceUid: string, ...segments: string[]): string {
  return [dataSourceUid, ...segments].map((segment) => encodeURIComponent(segment)).join('/');
}

/**
 * Same as {@link buildDatasourceProxyPath}, but returns an absolute URL including the
 * `/api/datasources/proxy/uid` prefix. Use this when calling `getBackendSrv()` directly
 * rather than through an RTK Query `baseUrl`.
 */
export function buildDatasourceProxyUrl(dataSourceUid: string, ...segments: string[]): string {
  return `${DATASOURCE_PROXY_PREFIX}/${buildDatasourceProxyPath(dataSourceUid, ...segments)}`;
}
