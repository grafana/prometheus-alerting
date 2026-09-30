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

export function createSlackSettingsSchema() {
  return inlineOrFileFields({
    inline: 'api_url',
    file: 'api_url_file',
    conflict: t('receivers.form.slack-api-url-conflict', 'Webhook URL and webhook URL file cannot be used together'),
  }).safeExtend({
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
  });
}

export function createSlackSettingsFormSchema() {
  return createSlackSettingsSchema().superRefine((settings, ctx) => {
    if (!settings.channel?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.slack-channel-required', 'Channel is required'),
        path: ['channel'],
      });
    }

    // Every action turns into a button or a menu in the Slack message, and Alertmanager will not
    // accept one that has nothing to show or nowhere to go. The whole list is one control on the
    // form, so the message goes on the list rather than on a row nobody can point at.
    settings.actions?.forEach((action) => {
      if (!action.type?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.slack-action-type-required', 'Every action needs a type'),
          path: ['actions'],
        });
      }
      if (!action.text?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.slack-action-text-required', 'Every action needs text'),
          path: ['actions'],
        });
      }
      if (!action.url?.trim() && !action.name?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.slack-action-target-required', 'Every action needs either a URL or a name'),
          path: ['actions'],
        });
      }
      if (action.confirm && !action.confirm.text?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.slack-action-confirm-text-required', 'Every confirmation needs text'),
          path: ['actions'],
        });
      }
    });
  });
}

export function createSlackIntegrationFormSchema() {
  return createIntegrationFormSchema('slack', createSlackSettingsFormSchema(), [
    {
      name: 'api_url',
      message: t('receivers.form.slack-api-url-invalid', 'Webhook URL must start with http:// or https://'),
    },
  ]);
}

export type SlackSettingsFormValues = z.infer<ReturnType<typeof createSlackSettingsSchema>>;
