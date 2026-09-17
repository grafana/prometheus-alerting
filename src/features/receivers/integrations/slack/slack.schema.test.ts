import { describe, expect, it } from '@rstest/core';
import { z } from 'zod';

import { createSlackSettingsFormSchema, createSlackSettingsSchema } from './slack.schema';

function messagesFor(actions: unknown, schema: z.ZodType = createSlackSettingsFormSchema()) {
  const result = schema.safeParse({
    api_url: 'https://hooks.slack.com/services/T/B/X',
    channel: '#alerts',
    actions,
  });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('createSlackSettingsFormSchema, actions', () => {
  it('accepts an action that links somewhere', () => {
    expect(messagesFor([{ type: 'button', text: 'Open', url: 'https://example.com' }])).toEqual([]);
  });

  it('accepts an action that carries a name instead of a URL', () => {
    expect(messagesFor([{ type: 'button', text: 'Ack', name: 'ack' }])).toEqual([]);
  });

  it('asks for the parts Alertmanager needs', () => {
    expect(messagesFor([{}])).toEqual([
      'Every action needs a type',
      'Every action needs text',
      'Every action needs either a URL or a name',
    ]);
  });

  it('asks for confirmation text once a confirmation is added', () => {
    expect(
      messagesFor([{ type: 'button', text: 'Open', url: 'https://example.com', confirm: { title: 'Sure?' } }])
    ).toEqual(['Every confirmation needs text']);
  });

  it('leaves a loaded config alone', () => {
    expect(messagesFor([{}], createSlackSettingsSchema())).toEqual([]);
  });
});
