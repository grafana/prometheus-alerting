import { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { SerializedError } from '@reduxjs/toolkit';
import { isForbiddenError, isNotFoundError, stringifyFetchError } from './errors';

describe('stringifyFetchError', () => {
  describe('FetchBaseQueryError with numeric status', () => {
    it('should format HTTP error with message field', () => {
      const error: FetchBaseQueryError = {
        status: 404,
        data: { message: 'Resource not found' },
      };
      expect(stringifyFetchError(error)).toBe('404 • Resource not found');
    });

    it('should format HTTP error with error field', () => {
      const error: FetchBaseQueryError = {
        status: 500,
        data: { error: 'Internal server error' },
      };
      expect(stringifyFetchError(error)).toBe('500 • Internal server error');
    });

    it('should format a plain-text response body', () => {
      const error: FetchBaseQueryError = {
        status: 400,
        data: 'Authentication to data source failed',
      };
      expect(stringifyFetchError(error)).toBe('400 • Authentication to data source failed');
    });

    it('should stringify data object when no message field', () => {
      const error: FetchBaseQueryError = {
        status: 400,
        data: { code: 'INVALID_INPUT', details: 'Missing required field' },
      };
      expect(stringifyFetchError(error)).toBe('400 • {"code":"INVALID_INPUT","details":"Missing required field"}');
    });

    it('should handle error with no data', () => {
      const error: FetchBaseQueryError = {
        status: 503,
        data: undefined,
      };
      expect(stringifyFetchError(error)).toBe('503 • HTTP error');
    });
  });

  describe('FetchBaseQueryError with string status', () => {
    it('should format FETCH_ERROR', () => {
      const error: FetchBaseQueryError = {
        status: 'FETCH_ERROR',
        error: 'Network request failed',
      };
      expect(stringifyFetchError(error)).toBe('FETCH_ERROR • Network request failed');
    });

    it('should format PARSING_ERROR', () => {
      const error: FetchBaseQueryError = {
        status: 'PARSING_ERROR',
        error: 'Unexpected token in JSON',
        originalStatus: 200,
        data: 'invalid json',
      };
      expect(stringifyFetchError(error)).toBe('PARSING_ERROR (200) • Unexpected token in JSON');
    });

    it('should format CUSTOM_ERROR', () => {
      const error: FetchBaseQueryError = {
        status: 'CUSTOM_ERROR',
        error: 'Custom validation failed',
        data: undefined,
      };
      expect(stringifyFetchError(error)).toBe('Custom validation failed');
    });
  });

  describe('SerializedError', () => {
    it('should format error with code and message', () => {
      const error: SerializedError = {
        code: 'ERR_TIMEOUT',
        message: 'Request timed out',
      };
      expect(stringifyFetchError(error)).toBe('ERR_TIMEOUT • Request timed out');
    });

    it('should format error with name and message', () => {
      const error: SerializedError = {
        name: 'TypeError',
        message: 'Cannot read property of undefined',
      };
      expect(stringifyFetchError(error)).toBe('TypeError • Cannot read property of undefined');
    });

    it('should handle error with only message', () => {
      const error: SerializedError = {
        message: 'Something went wrong',
      };
      expect(stringifyFetchError(error)).toBe('Something went wrong');
    });

    it('should handle empty error', () => {
      const error: SerializedError = {};
      expect(stringifyFetchError(error)).toBe('Unknown error occurred');
    });
  });
});

describe('isNotFoundError', () => {
  it('should return true for error with status 404', () => {
    const error: FetchBaseQueryError = {
      status: 404,
      data: { message: 'Not found' },
    };
    expect(isNotFoundError(error)).toBe(true);
  });

  it('should return false for non-404 errors', () => {
    const error: FetchBaseQueryError = {
      status: 500,
      data: { message: 'Internal server error' },
    };
    expect(isNotFoundError(error)).toBe(false);
  });

  it('should return false for null or undefined', () => {
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });
});

describe('isForbiddenError', () => {
  it('returns true for an HTTP 403 error', () => {
    const error: FetchBaseQueryError = {
      status: 403,
      data: { message: 'Forbidden' },
    };

    expect(isForbiddenError(error)).toBe(true);
  });

  it('returns false for errors that are not forbidden', () => {
    expect(isForbiddenError({ status: 500 })).toBe(false);
  });
});
