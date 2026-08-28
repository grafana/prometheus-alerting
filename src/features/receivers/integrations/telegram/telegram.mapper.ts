import type { TelegramConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createTelegramSettingsSchema, TelegramSettingsFormValues } from './telegram.schema';
export function telegramConfigToFormSettings(config: TelegramConfig): TelegramSettingsFormValues {
  return createTelegramSettingsSchema().parse({
    ...structuredClone(config),
    bot_token: config.bot_token ?? '',
    chat_id: config.chat_id?.toString() ?? '',
    message_thread_id: config.message_thread_id?.toString(),
  });
}
export function telegramFormSettingsToConfig(values: TelegramSettingsFormValues): TelegramConfig {
  const parsed = createTelegramSettingsSchema().parse(values);
  return omitEmptyValues({
    ...parsed,
    chat_id: Number(parsed.chat_id),
    message_thread_id: parsed.message_thread_id ? Number(parsed.message_thread_id) : undefined,
  });
}
export function createDefaultTelegramSettings(): TelegramSettingsFormValues {
  return { bot_token: '', chat_id: '', parse_mode: '' };
}
