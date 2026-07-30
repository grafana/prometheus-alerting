import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { isFetchError } from '@grafana/runtime';

export type ErrorLike = FetchBaseQueryError | SerializedError;

/**
 * Converts an RTK Query error into a human-readable string with status codes and details.
 * Handles both FetchBaseQueryError and SerializedError types.
 *
 * @param error - The error from an RTK Query mutation or query
 * @returns A formatted error string with status code (if available) and error details
 *
 * @example
 * // HTTP error with status code
 * stringifyFetchError({ status: 404, data: { message: 'Not found' } })
 * // => "404 • Not found"
 *
 * @example
 * // Fetch error
 * stringifyFetchError({ status: 'FETCH_ERROR', error: 'Network request failed' })
 * // => "FETCH_ERROR • Network request failed"
 *
 * @example
 * // Serialized error
 * stringifyFetchError({ message: 'Something went wrong', code: 'ERR_UNKNOWN' })
 * // => "ERR_UNKNOWN • Something went wrong"
 */
export function stringifyFetchError(error: ErrorLike): string {
  // Handle FetchBaseQueryError
  if ('status' in error) {
    const statusCode = error.status;

    // Handle numeric HTTP status codes
    if (typeof statusCode === 'number') {
      const data = error.data;

      // Try to extract a meaningful message from data
      if (data && typeof data === 'object') {
        // Check for common error message fields
        if ('message' in data && typeof data.message === 'string') {
          return `${statusCode} • ${data.message}`;
        }
        if ('error' in data && typeof data.error === 'string') {
          return `${statusCode} • ${data.error}`;
        }
        // Stringify the entire data object if no message field found
        try {
          return `${statusCode} • ${JSON.stringify(data)}`;
        } catch {
          return `${statusCode} • ${String(data)}`;
        }
      }

      return `${statusCode} • HTTP error`;
    }

    // Handle special status strings (FETCH_ERROR, PARSING_ERROR, CUSTOM_ERROR)
    if (statusCode === 'FETCH_ERROR') {
      return `FETCH_ERROR • ${'error' in error ? error.error : 'Network request failed'}`;
    }

    if (statusCode === 'PARSING_ERROR') {
      const originalStatus = 'originalStatus' in error ? error.originalStatus : 'unknown';
      const errorMessage = 'error' in error ? error.error : 'Failed to parse response';
      return `PARSING_ERROR (${originalStatus}) • ${errorMessage}`;
    }

    if (statusCode === 'CUSTOM_ERROR') {
      return `${'error' in error ? error.error : 'Unknown custom error occurred'}`;
    }

    // Fallback for any other status values
    return `${String(statusCode)} • ${
      'error' in error && typeof error.error === 'string' ? error.error : 'Unknown error'
    }`;
  }

  // Handle SerializedError
  if (error.code && error.message) {
    return `${error.code} • ${error.message}`;
  }

  if (error.name && error.message) {
    return `${error.name} • ${error.message}`;
  }

  if (error.message) {
    return error.message;
  }

  // Return fallback
  return 'Unknown error occurred';
}

/** Returns true for Grafana or RTK Query fetch errors with a 404 status. */
export function isNotFoundError(error: unknown): boolean {
  return isFetchError(error) && error.status === 404;
}

/** Returns true when a datasource-proxy request was denied by Grafana RBAC. */
export function isForbiddenError(error: unknown): boolean {
  return isFetchError(error) && error.status === 403;
}

/**
 * Extract a human-readable error message from any error type.
 * More generic than stringifyFetchError - handles Error objects, strings, and unknown types.
 *
 * Use this when you don't know the error type (e.g., in catch blocks with unknown errors).
 * Use stringifyFetchError when you specifically have an RTK Query error.
 */
export function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }

  if (typeof err === 'string') {
    return err;
  }

  if (typeof err === 'object' && err !== null) {
    const errorObj = err as Record<string, unknown>;

    // RTK Query error format: { data: { message: "..." } } or { data: "..." }
    if (errorObj.data) {
      if (typeof errorObj.data === 'string') {
        return errorObj.data;
      }
      if (typeof errorObj.data === 'object' && errorObj.data !== null) {
        const dataObj = errorObj.data as Record<string, unknown>;
        if (typeof dataObj.message === 'string') {
          return dataObj.message;
        }
        if (typeof dataObj.error === 'string') {
          return dataObj.error;
        }
      }
    }

    // Handle CUSTOM_ERROR format: { status: "CUSTOM_ERROR", error: { message: "..." } }
    if (errorObj.status === 'CUSTOM_ERROR' && errorObj.error) {
      // Recursively extract message from the nested error object
      return extractErrorMessage(errorObj.error);
    }

    // Handle nested error property that might be an object
    if (errorObj.error) {
      if (typeof errorObj.error === 'string') {
        return errorObj.error;
      }
      if (typeof errorObj.error === 'object' && errorObj.error !== null) {
        const nestedError = errorObj.error as Record<string, unknown>;
        if (typeof nestedError.message === 'string') {
          return nestedError.message;
        }
        if (typeof nestedError.error === 'string') {
          return nestedError.error;
        }
      }
    }

    // Direct message property
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }

    // Try JSON stringifying as last resort
    try {
      return JSON.stringify(err);
    } catch {
      return 'An unknown error occurred';
    }
  }

  return 'An unknown error occurred';
}
