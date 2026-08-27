import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { inlineOrFileFields } from './inlineOrFile.schema';

const required = 'Webhook URL is required';
const conflict = 'Webhook URL and webhook URL file cannot be used together';

function messagesFor(schema: z.ZodType, input: unknown) {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('inlineOrFileFields', () => {
  const webhookUrl = inlineOrFileFields({
    inline: 'webhook_url',
    file: 'webhook_url_file',
    required,
    conflict,
  });

  it('accepts either field on its own', () => {
    expect(messagesFor(webhookUrl, { webhook_url: 'http://hook' })).toEqual([]);
    expect(messagesFor(webhookUrl, { webhook_url_file: '/hook' })).toEqual([]);
  });

  it('rejects both at once', () => {
    expect(messagesFor(webhookUrl, { webhook_url: 'http://hook', webhook_url_file: '/hook' })).toEqual([conflict]);
  });

  it('rejects neither when a required message is given', () => {
    expect(messagesFor(webhookUrl, {})).toEqual([required]);
  });

  it('allows both to be empty when no required message is given', () => {
    const optionalPair = inlineOrFileFields({ inline: 'a', file: 'a_file', conflict });
    expect(messagesFor(optionalPair, {})).toEqual([]);
  });

  it('keeps the rule when an integration adds its own fields on top', () => {
    const settings = webhookUrl.safeExtend({ title: z.string().optional() });
    expect(messagesFor(settings, { title: 'hi' })).toEqual([required]);
    expect(messagesFor(settings, { webhook_url: 'http://hook', webhook_url_file: '/hook', title: 'hi' })).toEqual([
      conflict,
    ]);
    expect(messagesFor(settings, { webhook_url: 'http://hook', title: 'hi' })).toEqual([]);
  });

  it('checks every pair it is given', () => {
    const twoPairs = inlineOrFileFields(
      { inline: 'user_key', file: 'user_key_file', conflict: 'user key clash' },
      { inline: 'token', file: 'token_file', conflict: 'token clash' }
    );
    expect(messagesFor(twoPairs, { user_key: 'a', user_key_file: 'b', token: 'c', token_file: 'd' })).toEqual([
      'user key clash',
      'token clash',
    ]);
  });

  it('reports the error on the inline field', () => {
    const result = webhookUrl.safeParse({ webhook_url: 'http://hook', webhook_url_file: '/hook' });
    expect(result.success).toBe(false);
    expect(result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))).toEqual(['webhook_url']);
  });
});
