import type { TelegramConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createTelegramSettingsFormSchema, TelegramSettingsFormValues } from './telegram.schema';
export function telegramConfigToFormSettings(config: TelegramConfig): TelegramSettingsFormValues {
  return createTelegramSettingsFormSchema(false).parse({
    ...structuredClone(config),
    bot_token: config.bot_token ?? '',
    chat_id: config.chat_id?.toString() ?? '',
  });
}
export function telegramFormSettingsToConfig(values: TelegramSettingsFormValues): TelegramConfig {
  const parsed = createTelegramSettingsFormSchema(false).parse(values);
  return omitEmptyValues({
    ...parsed,
    chat_id: Number(parsed.chat_id),
  });
}
export function createDefaultTelegramSettings(): TelegramSettingsFormValues {
  return { bot_token: '', chat_id: '', parse_mode: '' };
}
