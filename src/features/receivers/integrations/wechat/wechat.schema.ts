import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';

export const WeChatSettingsSchema = z.looseObject({
  api_url: z.string().optional(),
  corp_id: z.string().optional(),
  agent_id: z.string().optional(),
  api_secret: z.string().optional(),
  to_user: z.string().optional(),
  to_party: z.string().optional(),
  to_tag: z.string().optional(),
  message: z.string().optional(),
  // The form offers these two through a dropdown, but a config loaded from elsewhere can hold
  // anything, and WeChat only sends the two.
  message_type: z.string().optional(),
  http_config: createHttpConfigFormSchema().optional(),
});

export const WeChatSettingsFormSchema = WeChatSettingsSchema.superRefine((settings, ctx) => {
  if (settings.message_type && settings.message_type !== 'text' && settings.message_type !== 'markdown') {
    ctx.addIssue({
      code: 'custom',
      message: t('receivers.form.wechat-message-type-invalid', 'Message type must be text or markdown'),
      path: ['message_type'],
    });
  }
});

export function createWeChatIntegrationFormSchema() {
  return createIntegrationFormSchema('wechat', WeChatSettingsFormSchema, [
    {
      name: 'api_url',
      message: t('receivers.form.wechat-api-url-invalid', 'API URL must start with http:// or https://'),
    },
  ]);
}
export type WeChatSettingsFormValues = z.infer<typeof WeChatSettingsSchema>;
