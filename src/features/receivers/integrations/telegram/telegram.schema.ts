import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

const integerString = z.string().superRefine((value, ctx) => {
  if (value !== '' && !/^-?\d+$/.test(value)) {
    ctx.addIssue({ code: 'custom', message: t('receivers.form.telegram-integer-required', 'Enter an integer') });
    return;
  }
  if (value !== '' && !Number.isSafeInteger(Number(value))) {
    ctx.addIssue({
      code: 'custom',
      message: t('receivers.form.telegram-integer-range', 'Enter an integer within the supported safe range'),
    });
  }
});
export function createTelegramSettingsFormSchema(validateForSubmission = true) {
  return inlineOrFileFields({
    inline: 'bot_token',
    file: 'bot_token_file',
    required: validateForSubmission
      ? t('receivers.form.telegram-bot-token-required', 'Bot token is required')
      : undefined,
    conflict: t('receivers.form.telegram-token-conflict', 'Bot token and bot token file cannot be used together'),
  }).safeExtend({
    api_url: z.string().optional(),
    chat_id: integerString.refine(
      (value) => value !== '',
      t('receivers.form.telegram-chat-id-required', 'Chat ID is required')
    ),
    message_thread_id: integerString.optional(),
    message: z.string().optional(),
    disable_notifications: z.boolean().optional(),
    parse_mode: z.enum(['', 'MarkdownV2', 'Markdown', 'HTML']).optional(),
    http_config: createHttpConfigFormSchema().optional(),
  });
}
export function createTelegramIntegrationFormSchema() {
  return createIntegrationFormSchema('telegram', createTelegramSettingsFormSchema());
}
export type TelegramSettingsFormValues = z.infer<ReturnType<typeof createTelegramSettingsFormSchema>>;
