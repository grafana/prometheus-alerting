import { isEmpty } from 'lodash';

import { t } from '@grafana/i18n';

import { extractErrorMessage, isForbiddenError } from '../../../utils/errors';

export interface RulesErrorFeedback {
  description: string;
  /**
   * Technical context – HTTP status and failing request – which is what makes an otherwise
   * opaque proxy failure such as "Bad Gateway" actionable.
   */
  details?: string;
}

/** Returns consistent user-facing feedback for datasource-backed rule requests. */
export function getRulesErrorFeedback(error: unknown): RulesErrorFeedback {
  const details = describeRequest(error);

  if (isForbiddenError(error)) {
    return {
      description: t(
        'alerting.rules-error.permission-denied-description',
        'You do not have permission to access rules from this data source.'
      ),
      details,
    };
  }

  return { description: describeError(error), details };
}

/**
 * Grafana wraps upstream failures in a generic message ("Bad Gateway"), while the actual cause
 * sits in a separate field of the response body – report the cause, it is the one that explains
 * what to fix. The generic message is already covered by the status line in the details.
 */
function describeError(error: unknown): string {
  if (hasResponseBody(error)) {
    const description = extractErrorCause(error) ?? extractErrorMessage(error);

    if (isNonEmptyString(description)) {
      return description;
    }
  }

  // Proxied failures frequently come back without a body at all, the status line is all we have
  return httpStatusLine(error) || extractErrorMessage(error);
}

/** The underlying cause, as reported next to the generic message by Grafana and Prometheus alike. */
function extractErrorCause(error: unknown): string | undefined {
  const data = getResponseBody(error);

  if (data && typeof data === 'object' && 'error' in data && isNonEmptyString(data.error)) {
    return data.error;
  }

  return undefined;
}

function describeRequest(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const parts = [httpStatusLine(error), getRequestUrl(error)];

  return parts.filter(isNonEmptyString).join(' · ') || undefined;
}

function httpStatusLine(error: unknown): string | undefined {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return undefined;
  }

  const { status } = error;

  // Non-HTTP failures use a status string, e.g. FETCH_ERROR or PARSING_ERROR
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
function getRequestUrl(error: object): string | undefined {
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
