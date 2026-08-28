import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { WeChatSettingsFormSchema, WeChatSettingsSchema } from './wechat.schema';

function messagesFor(messageType: string, schema: z.ZodType = WeChatSettingsFormSchema) {
  const result = schema.safeParse({ message_type: messageType });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('WeChatSettingsFormSchema', () => {
  it.each(['text', 'markdown', ''])('accepts the message type %s', (messageType) => {
    expect(messagesFor(messageType)).toEqual([]);
  });

  it('rejects a message type WeChat does not send', () => {
    expect(messagesFor('html')).toEqual(['Message type must be text or markdown']);
  });

  it('leaves a loaded config alone', () => {
    expect(messagesFor('html', WeChatSettingsSchema)).toEqual([]);
  });
});
