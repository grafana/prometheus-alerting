import { describe, expect, it } from '@rstest/core';

import { createEmailSettingsFormSchema } from './email.schema';

function messagesFor(input: Record<string, unknown>) {
  const result = createEmailSettingsFormSchema().safeParse({ to: 'alerts@example.com', ...input });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

const smarthostInvalid = 'Enter the mail server as host and port, like smtp.example.com:587';

describe('createEmailSettingsFormSchema, mail server', () => {
  it.each(['smtp.example.com:587', ':25', '[::1]:25'])('accepts %s', (smarthost) => {
    expect(messagesFor({ smarthost })).toEqual([]);
  });

  it.each(['smtp.example.com', 'smtp.example.com:', 'a:b:c'])('rejects %s', (smarthost) => {
    expect(messagesFor({ smarthost })).toEqual([smarthostInvalid]);
  });

  // Left empty, the mail server comes from the global SMTP settings instead.
  it('accepts an empty mail server', () => {
    expect(messagesFor({ smarthost: '' })).toEqual([]);
  });
});

describe('createEmailSettingsFormSchema, headers', () => {
  it('accepts headers with different names', () => {
    expect(messagesFor({ headers: { Subject: 'a', 'X-Priority': 'b' } })).toEqual([]);
  });

  // Mail headers ignore capitals, so these two are the same header twice.
  it('rejects two headers that only differ in capitals', () => {
    expect(messagesFor({ headers: { Subject: 'a', subject: 'b' } })).toEqual([
      'Two headers have the same name. Header names ignore capitals.',
    ]);
  });
});

describe('createEmailSettingsFormSchema, TLS', () => {
  it('rejects a TLS version Alertmanager does not know', () => {
    expect(messagesFor({ tls_config: { min_version: 'TLS9' } })).toEqual([
      'TLS version must be TLS10, TLS11, TLS12 or TLS13',
    ]);
  });

  it('accepts one it does', () => {
    expect(messagesFor({ tls_config: { min_version: 'TLS12' } })).toEqual([]);
  });
});
