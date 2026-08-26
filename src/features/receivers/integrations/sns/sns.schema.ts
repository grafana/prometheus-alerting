import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';

const SNSSigV4FormSchema = z
  .looseObject({
    region: z.string().optional(),
    access_key: z.string().optional(),
    secret_key: z.string().optional(),
    profile: z.string().optional(),
    role_arn: z.string().optional(),
  })
  .superRefine((sigV4, ctx) => {
    if (Boolean(sigV4.access_key) !== Boolean(sigV4.secret_key)) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.sns-access-secret-pair', 'Access key and secret key must be supplied together'),
        path: ['access_key'],
      });
    }
  });

export function createSNSSettingsFormSchema() {
  return z
    .looseObject({
      api_url: z.string().optional(),
      sigv4: SNSSigV4FormSchema.optional(),
      topic_arn: z.string().optional(),
      phone_number: z.string().optional(),
      target_arn: z.string().optional(),
      subject: z.string().optional(),
      message: z.string().optional(),
      attributes: z.record(z.string(), z.string()).optional(),
      http_config: createHttpConfigFormSchema().optional(),
    })
    .superRefine((settings, ctx) => {
      if (!settings.topic_arn && !settings.phone_number && !settings.target_arn) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.sns-destination-required', 'Topic ARN, phone number, or target ARN is required'),
          path: ['topic_arn'],
        });
      }
    });
}

export function createSNSIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('sns'),
    sendResolved: z.boolean(),
    settings: createSNSSettingsFormSchema(),
  });
}

export type SNSSettingsFormValues = z.infer<ReturnType<typeof createSNSSettingsFormSchema>>;
