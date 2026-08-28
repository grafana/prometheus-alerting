import { describe, expect, it } from 'vitest';

import { tlsVersionSchema } from './tlsConfig.schema';

describe('tlsVersionSchema', () => {
  it.each(['TLS10', 'TLS11', 'TLS12', 'TLS13', ''])('accepts %s', (value) => {
    expect(tlsVersionSchema.safeParse(value).success).toBe(true);
  });

  it.each(['TLS9', 'TLS1.2', 'tls12', '1.2'])('rejects %s', (value) => {
    expect(tlsVersionSchema.safeParse(value).success).toBe(false);
  });
});
