import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { tlsVersionSchema } from '../shared/tlsConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

const EmailTLSConfigFormSchema = z.looseObject({
  server_name: z.string().optional(),
  insecure_skip_verify: z.boolean().optional(),
  min_version: tlsVersionSchema,
  max_version: tlsVersionSchema,
});

/**
 * The mail server has to be given as host and port together. Either an ordinary "host:port", or an
 * IPv6 address in brackets, and the port can't be left off.
 */
const SMARTHOST = /^(?:\[[^\]]+\]|[^:]*):[^:]+$/;

export function createEmailSettingsSchema() {
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
      if (settings.smarthost?.trim() && !SMARTHOST.test(settings.smarthost.trim())) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.email-smarthost-invalid',
            'Enter the mail server as host and port, like smtp.example.com:587'
          ),
          path: ['smarthost'],
        });
      }

      // Mail headers don't care about capitals, so "Subject" and "subject" are the same header
      // twice as far as the mail server is concerned, and Alertmanager refuses the pair.
      const seen = new Set<string>();
      for (const header of Object.keys(settings.headers ?? {})) {
        const normalized = header.trim().toLowerCase();
        if (!normalized) {
          continue;
        }
        if (seen.has(normalized)) {
          ctx.addIssue({
            code: 'custom',
            message: t(
              'receivers.form.email-header-duplicate',
              'Two headers have the same name. Header names ignore capitals.'
            ),
            path: ['headers'],
          });
          continue;
        }
        seen.add(normalized);
      }
    });
}

export function createEmailSettingsFormSchema() {
  return createEmailSettingsSchema().superRefine((settings, ctx) => {
    if (!settings.to?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.email-to-required', 'Recipient is required'),
        path: ['to'],
      });
    }
  });
}

export function createEmailIntegrationFormSchema() {
  return createIntegrationFormSchema('email', createEmailSettingsFormSchema());
}

export type EmailSettingsFormValues = z.infer<ReturnType<typeof createEmailSettingsSchema>>;
