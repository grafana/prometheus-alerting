import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
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

export const SNSSettingsSchema = z
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
    const destinations = [settings.topic_arn, settings.phone_number, settings.target_arn].filter((value) =>
      Boolean(value?.trim())
    );

    if (destinations.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.sns-destination-required', 'Topic ARN, phone number, or target ARN is required'),
        path: ['topic_arn'],
      });
    }
  });

export const SNSSettingsFormSchema = SNSSettingsSchema.superRefine((settings, ctx) => {
  const destinations = [settings.topic_arn, settings.phone_number, settings.target_arn].filter((value) =>
    Boolean(value?.trim())
  );

  // Alertmanager wants one destination, and rejects a config that names two. Filling in all
  // three slips past its check, but that is a quirk of how the check is written rather than
  // something worth offering people, so we ask for one either way.
  if (destinations.length > 1) {
    ctx.addIssue({
      code: 'custom',
      message: t(
        'receivers.form.sns-destination-conflict',
        'Only one of topic ARN, phone number, or target ARN can be set'
      ),
      path: ['topic_arn'],
    });
  }
});

export function createSNSIntegrationFormSchema() {
  return createIntegrationFormSchema('sns', SNSSettingsFormSchema, [
    {
      name: 'api_url',
      message: t('receivers.form.sns-api-url-invalid', 'API URL must start with http:// or https://'),
    },
  ]);
}

export type SNSSettingsFormValues = z.infer<typeof SNSSettingsSchema>;
