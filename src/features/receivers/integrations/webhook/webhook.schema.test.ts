import { describe, expect, it } from 'vitest';

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

const invalid = 'Enter a duration such as 30s, 5m, or 2h';

describe('createWebhookSettingsFormSchema, timeout', () => {
  it.each(['30s', '5m', '5m30s', '100ms', '2h', ''])('accepts %s', (value) => {
    expect(messagesFor(value)).toEqual([]);
  });

  // Alertmanager changed how it reads this field in 0.33, so the form takes only the shapes that
  // work either way: "1d" is refused by the newer reader, "1.2s" by the older one.
  it.each(['1d', '1.2s', 'abc', '10'])('rejects %s', (value) => {
    expect(messagesFor(value)).toEqual([invalid]);
  });
});
