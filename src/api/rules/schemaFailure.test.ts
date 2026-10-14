import { NamedSchemaError } from '@reduxjs/toolkit/query';
import { describe, expect, it } from 'vitest';

import { toSchemaFailureError } from './schemaFailure';

describe('toSchemaFailureError', () => {
  it('describes an issue without a path by its message alone, and has no url without request meta', () => {
    const error = new NamedSchemaError([{ message: 'Expected string' }], 42, 'responseSchema', undefined);

    expect(toSchemaFailureError(error)).toEqual({
      status: 'CUSTOM_ERROR',
      error: 'The data source returned a response that does not match the Prometheus rules API (Expected string)',
      url: undefined,
    });
  });
});
