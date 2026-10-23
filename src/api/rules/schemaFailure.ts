import type { FetchBaseQueryError, NamedSchemaError } from '@reduxjs/toolkit/query';

import { t } from '@grafana/i18n';

/**
 * Turns a response that failed its schema check into a regular query error.
 *
 * Without this RTK Query treats the failure as a crash: it logs it and hands back a serialized
 * error whose message is a dump of every zod issue. Converted, the failure shows up like any other
 * failed request – with a readable description and the URL that returned the unexpected response.
 */
export function toSchemaFailureError(error: NamedSchemaError): FetchBaseQueryError & { url?: string } {
  // A failed check always has at least one issue, the first one is enough to point at the problem
  const [issue] = error.issues;
  const path = issue.path?.map((segment) => (typeof segment === 'object' ? segment.key : segment)).join('.');
  const detail = path ? `${path}: ${issue.message}` : issue.message;

  return {
    status: 'CUSTOM_ERROR',
    error: t(
      'alerting.rules-error.unexpected-response',
      'The data source returned a response that does not match the Prometheus rules API ({{detail}})',
      { detail }
    ),
    url: getRequestUrl(error._bqMeta),
  };
}

// fetchBaseQuery hands the request along as meta, the Ruler endpoints don't have any
function getRequestUrl(meta: unknown): string | undefined {
  if (meta && typeof meta === 'object' && 'request' in meta && meta.request instanceof Request) {
    return meta.request.url;
  }

  return undefined;
}
