import { t } from '@grafana/i18n';
import { z } from 'zod';

import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

const EmailTLSConfigFormSchema = z.looseObject({
  server_name: z.string().optional(),
  insecure_skip_verify: z.boolean().optional(),
  min_version: z.string().optional(),
  max_version: z.string().optional(),
});

export function createEmailSettingsFormSchema(validateForSubmission = true) {
  return inlineOrFileFields({
    inline: 'auth_password',
    file: 'auth_password_file',
    conflict: t('receivers.form.email-password-conflict', 'Password and password file cannot be used together'),
  })
    .safeExtend({
      to: z.string().optional(),
      from: z.string().optional(),
      smarthost: z.string().optional(),
      hello: z.string().optional(),
      auth_username: z.string().optional(),
      auth_secret: z.string().optional(),
      auth_identity: z.string().optional(),
      headers: z.record(z.string(), z.string()).optional(),
      html: z.string().optional(),
      text: z.string().optional(),
      require_tls: z.boolean().optional(),
      tls_config: EmailTLSConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (validateForSubmission && !settings.to?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.email-to-required', 'Recipient is required'),
          path: ['to'],
        });
      }
    });
}

export function createEmailIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('email'),
    sendResolved: z.boolean(),
    settings: createEmailSettingsFormSchema(),
  });
}

export type EmailSettingsFormValues = z.infer<ReturnType<typeof createEmailSettingsFormSchema>>;
