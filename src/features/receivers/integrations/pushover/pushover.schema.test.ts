import { describe, expect, it } from 'vitest';

import { createPushoverSettingsFormSchema } from './pushover.schema';

function messagesFor(input: Record<string, unknown>) {
  const result = createPushoverSettingsFormSchema().safeParse({ user_key: 'user', token: 'token', ...input });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

const invalid = 'Enter a duration such as 30s, 5m30s, or 1.5h';

describe('createPushoverSettingsFormSchema, durations', () => {
  // Pushover's three durations are read by Go itself, which takes fractions and milliseconds
  // but has no unit for days.
  it.each(['retry', 'expire', 'ttl'])('checks %s', (field) => {
    expect(messagesFor({ [field]: '5m30s' })).toEqual([]);
    expect(messagesFor({ [field]: '100ms' })).toEqual([]);
    expect(messagesFor({ [field]: '1.5h' })).toEqual([]);
    expect(messagesFor({ [field]: '1d' })).toEqual([invalid]);
    expect(messagesFor({ [field]: '5' })).toEqual([invalid]);
  });
});

describe('createPushoverSettingsFormSchema, message formatting', () => {
  const messagesFor = (extra: Record<string, unknown>) => {
    const result = createPushoverSettingsFormSchema().safeParse({ user_key: 'u', token: 't', ...extra });
    return result.success ? [] : result.error.issues.map((issue) => issue.message);
  };

  it('accepts either formatting on its own', () => {
    expect(messagesFor({ html: true })).toEqual([]);
    expect(messagesFor({ monospace: true })).toEqual([]);
    expect(messagesFor({ html: false, monospace: true })).toEqual([]);
  });

  // Pushover picks one or the other, and Alertmanager refuses a config asking for both.
  it('rejects both at once', () => {
    expect(messagesFor({ html: true, monospace: true })).toEqual([
      'HTML and monospace formatting cannot be used together',
    ]);
  });
});
