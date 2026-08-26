import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

const SlackActionFormSchema = z.looseObject({
  type: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  style: z.string().optional(),
  name: z.string().optional(),
  value: z.string().optional(),
  confirm: z
    .looseObject({
      title: z.string().optional(),
      text: z.string().optional(),
      ok_text: z.string().optional(),
      dismiss_text: z.string().optional(),
    })
    .optional(),
});

export function createSlackSettingsFormSchema(validateForSubmission = true) {
  return inlineOrFileFields({
    inline: 'api_url',
    file: 'api_url_file',
    conflict: t('receivers.form.slack-api-url-conflict', 'Webhook URL and webhook URL file cannot be used together'),
  })
    .safeExtend({
      channel: z.string().optional(),
      username: z.string().optional(),
      color: z.string().optional(),
      title: z.string().optional(),
      title_link: z.string().optional(),
      pretext: z.string().optional(),
      text: z.string().optional(),
      short_fields: z.boolean().optional(),
      footer: z.string().optional(),
      fallback: z.string().optional(),
      callback_id: z.string().optional(),
      icon_emoji: z.string().optional(),
      icon_url: z.string().optional(),
      image_url: z.string().optional(),
      thumb_url: z.string().optional(),
      link_names: z.boolean().optional(),
      mrkdwn_in: z.array(z.string()).optional(),
      actions: z.array(SlackActionFormSchema).optional(),
      http_config: createHttpConfigFormSchema().optional(),
    })
    .superRefine((settings, ctx) => {
      if (validateForSubmission && !settings.channel?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.slack-channel-required', 'Channel is required'),
          path: ['channel'],
        });
      }
    });
}

export function createSlackIntegrationFormSchema() {
  return createIntegrationFormSchema('slack', createSlackSettingsFormSchema());
}

export type SlackSettingsFormValues = z.infer<ReturnType<typeof createSlackSettingsFormSchema>>;
