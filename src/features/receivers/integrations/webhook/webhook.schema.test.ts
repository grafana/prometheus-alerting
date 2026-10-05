import { describe, expect, it } from '@rstest/core';

import { createWebhookSettingsFormSchema } from './webhook.schema';

function messagesFor(timeout: string) {
  const result = createWebhookSettingsFormSchema().safeParse({
    url: 'https://example.com/webhook',
    max_alerts: '',
    timeout,
    http_config: {},
  });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

const invalid = 'Enter a duration such as 30s, 5m30s, or 1.5h';

describe('createWebhookSettingsFormSchema, timeout', () => {
  // Alertmanager reads this the way Go does, so fractions and milliseconds are fine.
  it.each(['30s', '5m', '5m30s', '100ms', '1.5h', '1.2s', '0', ''])('accepts %s', (value) => {
    expect(messagesFor(value)).toEqual([]);
  });

  // Go has no unit for days, and a bare number has no unit at all.
  it.each(['1d', '1w', 'abc', '10'])('rejects %s', (value) => {
    expect(messagesFor(value)).toEqual([invalid]);
  });
});
