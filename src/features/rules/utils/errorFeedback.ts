import { isEmpty } from 'lodash';

import { t } from '@grafana/i18n';

import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

/**
 * `status` and `url` are the technical side of the failure, which is what makes an otherwise opaque
 * proxy failure such as "Bad Gateway" actionable.
 */
export interface RulesErrorFeedback {
  description: string;
  /** The HTTP status line, e.g. "HTTP 502 Bad Gateway", or the status of a non-HTTP failure, e.g. "FETCH_ERROR" */
  status?: string;
  /** The request that failed */
  url?: string;
}

/** Returns consistent user-facing feedback for datasource-backed rule requests. */
export function getRulesErrorFeedback(error: unknown): RulesErrorFeedback {
  const request = { status: httpStatusLine(error), url: getRequestUrl(error) };

  if (isForbiddenError(error)) {
    return {
      description: t(
        'alerting.rules-error.permission-denied-description',
        'You do not have permission to access rules from this data source.'
      ),
      ...request,
    };
  }

  return { description: describeError(error), ...request };
}

/**
 * Grafana wraps upstream failures in a generic message ("Bad Gateway"), while the actual cause
 * sits in a separate field of the response body – report the cause, it is the one that explains
 * what to fix. The generic message is already covered by the status line.
 */
function describeError(error: unknown): string {
  if (hasResponseBody(error)) {
    const description = extractErrorCause(error) ?? extractErrorMessage(error);

    if (isNonEmptyString(description)) {
      return description.trim();
    }
  }

  // Proxied failures frequently come back without a body at all, the status line is all we have
  const fallback = httpStatusLine(error) || extractErrorMessage(error).trim();
  return fallback || t('alerting.rules-error.unknown', 'An unknown error occurred');
}

/** The underlying cause, as reported next to the generic message by Grafana and Prometheus alike. */
function extractErrorCause(error: unknown): string | undefined {
  const data = getResponseBody(error);

  if (data && typeof data === 'object' && 'error' in data && isNonEmptyString(data.error)) {
    return data.error;
  }

  return undefined;
}

function httpStatusLine(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return undefined;
  }

  const { status } = error;

  // Non-HTTP failures use a status string, e.g. FETCH_ERROR or PARSING_ERROR. Leave out CUSTOM_ERROR,
  // it is the label we give anything that was not an HTTP error, and says nothing about what went wrong
  if (status === 'CUSTOM_ERROR') {
    return undefined;
  }

  if (isNonEmptyString(status)) {
    return status;
  }

  if (typeof status !== 'number') {
    return undefined;
  }

  const statusText = 'statusText' in error && isNonEmptyString(error.statusText) ? ` ${error.statusText}` : '';
  return `HTTP ${status}${statusText}`;
}

/** The failing request, either flattened onto the error or on the original fetch config. */
function getRequestUrl(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  if ('url' in error && isNonEmptyString(error.url)) {
    return error.url;
  }

  if ('config' in error && error.config && typeof error.config === 'object' && 'url' in error.config) {
    return isNonEmptyString(error.config.url) ? error.config.url : undefined;
  }

  return undefined;
}

function getResponseBody(error: unknown): unknown {
  if (error && typeof error === 'object' && 'data' in error) {
    return error.data;
  }

  return undefined;
}

function hasResponseBody(error: unknown): boolean {
  // Errors without a response body (thrown Errors, strings) still carry their own message
  if (!error || typeof error !== 'object' || !('data' in error)) {
    return true;
  }

  const data = getResponseBody(error);

  if (typeof data === 'string') {
    return data.trim().length > 0;
  }

  return Boolean(data) && !isEmpty(data);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
