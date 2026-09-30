import { describe, expect, it } from 'vitest';

import { createTelegramSettingsFormSchema } from './telegram.schema';

function messagesFor(chatId: string) {
  const result = createTelegramSettingsFormSchema().safeParse({ bot_token: 'token', chat_id: chatId });
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('createTelegramSettingsFormSchema', () => {
  it('accepts a real chat ID, including a negative one for groups', () => {
    expect(messagesFor('123')).toEqual([]);
    expect(messagesFor('-1001234567890')).toEqual([]);
  });

  // Alertmanager reads zero as "not set" and refuses the config.
  it('rejects a chat ID of zero', () => {
    expect(messagesFor('0')).toEqual(['Chat ID cannot be 0']);
    expect(messagesFor('-0')).toEqual(['Chat ID cannot be 0']);
  });

  it('still asks for a chat ID when the field is empty', () => {
    expect(messagesFor('')).toEqual(['Chat ID is required']);
  });
});
