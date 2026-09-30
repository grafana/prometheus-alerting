import { describe, expect, it } from 'vitest';

import { JiraSettingsFormSchema } from './jira.schema';

function messagesFor(reopenDuration: string) {
  const result = JiraSettingsFormSchema.safeParse({
    api_url: 'https://jira.example.com',
    project: 'OPS',
    issue_type: 'Bug',
    reopen_duration: reopenDuration,
  });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

const invalid = 'Enter a duration such as 30s, 5m, or 1d12h';

describe('JiraSettingsFormSchema, reopen duration', () => {
  // Jira reads this the Prometheus way, which has days and weeks but no fractions.
  it.each(['30s', '5m', '1d', '1w', '1d12h', ''])('accepts %s', (value) => {
    expect(messagesFor(value)).toEqual([]);
  });

  it.each(['1.2s', '12h1d', 'tomorrow'])('rejects %s', (value) => {
    expect(messagesFor(value)).toEqual([invalid]);
  });
});
