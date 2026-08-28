import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { SNSSettingsFormSchema, SNSSettingsSchema } from './sns.schema';

function messagesFor(input: unknown, schema: z.ZodType = SNSSettingsFormSchema) {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('SNSSettingsFormSchema', () => {
  it('asks for a destination when there is none', () => {
    expect(messagesFor({})).toEqual(['Topic ARN, phone number, or target ARN is required']);
  });

  it('accepts exactly one destination', () => {
    expect(messagesFor({ topic_arn: 'arn:topic' })).toEqual([]);
    expect(messagesFor({ phone_number: '+15550000' })).toEqual([]);
    expect(messagesFor({ target_arn: 'arn:target' })).toEqual([]);
  });

  // Alertmanager turns away a config that names two destinations, which is easy to do by accident.
  it('rejects two destinations at once', () => {
    expect(messagesFor({ topic_arn: 'arn:topic', target_arn: 'arn:target' })).toEqual([
      'Only one of topic ARN, phone number, or target ARN can be set',
    ]);
  });

  it('leaves a loaded config alone', () => {
    expect(messagesFor({ topic_arn: 'arn:topic', target_arn: 'arn:target' }, SNSSettingsSchema)).toEqual([]);
  });
});
