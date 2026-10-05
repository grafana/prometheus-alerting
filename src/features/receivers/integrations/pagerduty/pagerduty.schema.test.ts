import { describe, expect, it } from '@rstest/core';
import { z } from 'zod';

import { PagerDutySettingsFormSchema, PagerDutySettingsSchema } from './pagerduty.schema';

function messagesFor(input: unknown, schema: z.ZodType = PagerDutySettingsFormSchema) {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('PagerDutySettingsFormSchema', () => {
  it('asks for a key when neither is filled in', () => {
    expect(messagesFor({})).toEqual(['Routing key or service key is required']);
  });

  it('accepts either key on its own', () => {
    expect(messagesFor({ routing_key: 'routing' })).toEqual([]);
    expect(messagesFor({ service_key: 'service' })).toEqual([]);
  });

  it('treats whitespace as empty', () => {
    expect(messagesFor({ routing_key: '   ' })).toEqual(['Routing key or service key is required']);
  });

  // A config saved elsewhere can keep its key in a file, which this form does not offer, so
  // loading one has to stay possible.
  it('leaves a loaded config alone', () => {
    expect(messagesFor({}, PagerDutySettingsSchema)).toEqual([]);
  });
});
