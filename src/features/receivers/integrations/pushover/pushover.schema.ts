import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { goDurationSchema } from '../shared/duration.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

export function createPushoverSettingsSchema() {
  return inlineOrFileFields(
    {
      inline: 'user_key',
      file: 'user_key_file',
      conflict: t('receivers.form.pushover-user-key-conflict', 'User key and user key file cannot be used together'),
    },
    {
      inline: 'token',
      file: 'token_file',
      conflict: t('receivers.form.pushover-token-conflict', 'Token and token file cannot be used together'),
    }
  ).safeExtend({
    title: z.string().optional(),
    message: z.string().optional(),
    url: z.string().optional(),
    url_title: z.string().optional(),
    device: z.string().optional(),
    sound: z.string().optional(),
    priority: z.string().optional(),
    retry: goDurationSchema,
    expire: goDurationSchema,
    ttl: goDurationSchema,
    html: z.boolean().optional(),
    monospace: z.boolean().optional(),
    http_config: createHttpConfigFormSchema().optional(),
  });
}

export function createPushoverSettingsFormSchema() {
  return createPushoverSettingsSchema().superRefine((settings, ctx) => {
    if (!settings.user_key?.trim() && !settings.user_key_file?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.pushover-user-key-required', 'User key is required'),
        path: ['user_key'],
      });
    }

    if (!settings.token?.trim() && !settings.token_file?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.pushover-token-required', 'Token is required'),
        path: ['token'],
      });
    }

    // Pushover formats a message as HTML or as monospace, never both, and Alertmanager turns away
    // a config that asks for the pair.
    if (settings.html && settings.monospace) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.pushover-html-monospace-conflict',
          'HTML and monospace formatting cannot be used together'
        ),
        path: ['monospace'],
      });
    }

    if (settings.priority && !/^-?[0-2]$/.test(settings.priority) && !settings.priority.includes('{{')) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.pushover-priority-invalid', 'Priority must be between -2 and 2'),
        path: ['priority'],
      });
    }
  });
}
export function createPushoverIntegrationFormSchema() {
  return createIntegrationFormSchema('pushover', createPushoverSettingsFormSchema());
}
export type PushoverSettingsFormValues = z.infer<ReturnType<typeof createPushoverSettingsSchema>>;
