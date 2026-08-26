import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

function createDurationSchema() {
  return z
    .string()
    .regex(/^(\d+[smh])+$/, t('receivers.form.pushover-duration-invalid', 'Enter a duration such as 30s, 5m30s, or 8h'))
    .or(z.literal(''))
    .optional();
}
export function createPushoverSettingsFormSchema(validateForSubmission = true) {
  return inlineOrFileFields(
    {
      inline: 'user_key',
      file: 'user_key_file',
      required: validateForSubmission
        ? t('receivers.form.pushover-user-key-required', 'User key is required')
        : undefined,
      conflict: t('receivers.form.pushover-user-key-conflict', 'User key and user key file cannot be used together'),
    },
    {
      inline: 'token',
      file: 'token_file',
      required: validateForSubmission ? t('receivers.form.pushover-token-required', 'Token is required') : undefined,
      conflict: t('receivers.form.pushover-token-conflict', 'Token and token file cannot be used together'),
    }
  )
    .safeExtend({
      title: z.string().optional(),
      message: z.string().optional(),
      url: z.string().optional(),
      url_title: z.string().optional(),
      device: z.string().optional(),
      sound: z.string().optional(),
      priority: z.string().optional(),
      retry: z.string().optional(),
      expire: z.string().optional(),
      ttl: createDurationSchema(),
      html: z.boolean().optional(),
      monospace: z.boolean().optional(),
      http_config: createHttpConfigFormSchema().optional(),
    })
    .superRefine((settings, ctx) => {
      if (
        validateForSubmission &&
        settings.priority &&
        !/^-?[0-2]$/.test(settings.priority) &&
        !settings.priority.includes('{{')
      ) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.pushover-priority-invalid', 'Priority must be between -2 and 2'),
          path: ['priority'],
        });
      }
    });
}
export function createPushoverIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('pushover'),
    sendResolved: z.boolean(),
    settings: createPushoverSettingsFormSchema(),
  });
}
export type PushoverSettingsFormValues = z.infer<ReturnType<typeof createPushoverSettingsFormSchema>>;
