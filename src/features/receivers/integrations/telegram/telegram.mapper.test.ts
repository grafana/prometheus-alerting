import type { TelegramConfig } from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultTelegramSettings,
  telegramConfigToFormSettings,
  telegramFormSettingsToConfig,
} from './telegram.mapper';
import { createTelegramSettingsFormSchema } from './telegram.schema';
describe('Telegram mapper', () => {
  it('converts numeric IDs and round-trips unknown fields', () => {
    const config = {
      bot_token: 'secret',
      chat_id: -12345,
      message_thread_id: 42,
      parse_mode: 'HTML',
      http_config: { follow_redirects: false },
      future_option: 'keep',
    } satisfies TelegramConfig;
    const settings = telegramConfigToFormSettings(config);
    expect(settings.chat_id).toBe('-12345');
    expect(settings.message_thread_id).toBe('42');
    expect(telegramFormSettingsToConfig(settings)).toEqual(config);
  });
  it('round-trips a bot-token-file-only configuration', () => {
    const config = { bot_token_file: '/run/secrets/telegram-token', chat_id: -12345 } satisfies TelegramConfig;
    expect(telegramFormSettingsToConfig(telegramConfigToFormSettings(config))).toEqual(config);
  });
  it('requires bot token and integer chat ID', () => {
    const result = createTelegramSettingsFormSchema().safeParse(createDefaultTelegramSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['bot_token'], ['chat_id']])
      );
    }
  });
  it('rejects chat IDs beyond the safe integer range', () => {
    const settings = createDefaultTelegramSettings();
    settings.bot_token = 'secret';
    settings.chat_id = '100000000000000000000';
    expect(createTelegramSettingsFormSchema().safeParse(settings).success).toBe(false);
  });
  it('rejects a non-integer chat ID', () => {
    const settings = createDefaultTelegramSettings();
    settings.bot_token = 'secret';
    settings.chat_id = '12.5';
    expect(createTelegramSettingsFormSchema().safeParse(settings).success).toBe(false);
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('Telegram settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      bot_token_file: '/etc/alerting/telegram',
      chat_id: 12345,
      message_thread_id: 42,
    };

    expect(telegramFormSettingsToConfig(telegramConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
