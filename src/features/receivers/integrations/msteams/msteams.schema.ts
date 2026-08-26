import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

export function createMSTeamsSettingsFormSchema() {
  return inlineOrFileFields({
    inline: 'webhook_url',
    file: 'webhook_url_file',
    required: t('receivers.form.msteams-webhook-required', 'Webhook URL is required'),
    conflict: t('receivers.form.msteams-webhook-conflict', 'Webhook URL and webhook URL file cannot be used together'),
  }).safeExtend({
    title: z.string().optional(),
    summary: z.string().optional(),
    text: z.string().optional(),
    http_config: createHttpConfigFormSchema().optional(),
  });
}
export function createMSTeamsIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('msteams'),
    sendResolved: z.boolean(),
    settings: createMSTeamsSettingsFormSchema(),
  });
}
export type MSTeamsSettingsFormValues = z.infer<ReturnType<typeof createMSTeamsSettingsFormSchema>>;
