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
