import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

export function createDiscordSettingsFormSchema() {
  return inlineOrFileFields({
    inline: 'webhook_url',
    file: 'webhook_url_file',
    required: t('receivers.form.discord-webhook-required', 'Webhook URL is required'),
    conflict: t('receivers.form.discord-webhook-conflict', 'Webhook URL and webhook URL file cannot be used together'),
  }).safeExtend({
    title: z.string().optional(),
    message: z.string().optional(),
    content: z.string().optional(),
    username: z.string().optional(),
    avatar_url: z.string().optional(),
    http_config: createHttpConfigFormSchema().optional(),
  });
}
export function createDiscordIntegrationFormSchema() {
  return createIntegrationFormSchema('discord', createDiscordSettingsFormSchema(), [
    {
      name: 'webhook_url',
      message: t('receivers.form.discord-webhook-url-invalid', 'Webhook URL must start with http:// or https://'),
    },
  ]);
}
export type DiscordSettingsFormValues = z.infer<ReturnType<typeof createDiscordSettingsFormSchema>>;
