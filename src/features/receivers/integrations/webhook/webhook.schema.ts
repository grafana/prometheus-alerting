import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

export function createWebhookSettingsFormSchema() {
  return inlineOrFileFields({
    inline: 'url',
    file: 'url_file',
    required: t('receivers.form.webhook-url-required', 'Webhook URL is required'),
    conflict: t('receivers.form.webhook-url-conflict', 'Webhook URL and URL file cannot be used together'),
  }).safeExtend({
    max_alerts: z.string().superRefine((value, ctx) => {
      if (value === '') {
        return;
      }
      const parsed = Number(value);
      if (!Number.isSafeInteger(parsed) || parsed < 0) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.webhook-max-alerts-invalid', 'Max alerts must be a non-negative integer'),
        });
      }
    }),
    timeout: z.string().optional(),
    http_config: createHttpConfigFormSchema({ oauth2: true }),
  });
}

export function createWebhookIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('webhook'),
    sendResolved: z.boolean(),
    settings: createWebhookSettingsFormSchema(),
  });
}

export type WebhookSettingsFormValues = z.infer<ReturnType<typeof createWebhookSettingsFormSchema>>;
