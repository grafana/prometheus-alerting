import { describe, expect, it } from 'vitest';

import { goDurationSchema, prometheusDurationSchema } from './duration.schema';

function accepts(schema: { safeParse: (value: unknown) => { success: boolean } }, value: string) {
  return schema.safeParse(value).success;
}

describe('goDurationSchema', () => {
  it.each(['30s', '5m30s', '8h', '100ms', '1.5h', '0', ''])('accepts %s', (value) => {
    expect(accepts(goDurationSchema, value)).toBe(true);
  });

  // Days and anything longer are not units Go knows, and a bare number has no unit at all.
  it.each(['1d', '1w', '5', 'abc', 'tomorrow'])('rejects %s', (value) => {
    expect(accepts(goDurationSchema, value)).toBe(false);
  });
});

describe('prometheusDurationSchema', () => {
  it.each(['30s', '5m', '1d', '1w', '1y', '1d12h', '100ms', '0', ''])('accepts %s', (value) => {
    expect(accepts(prometheusDurationSchema, value)).toBe(true);
  });

  // Whole numbers only, and the units have to run from largest to smallest.
  it.each(['1.2s', '12h1d', '5', 'abc'])('rejects %s', (value) => {
    expect(accepts(prometheusDurationSchema, value)).toBe(false);
  });
});
