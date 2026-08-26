import { t } from '@grafana/i18n';
import { z } from 'zod';

const SNSHttpConfigFormSchema = z
  .looseObject({
    authorization: z.looseObject({ type: z.string().optional(), credentials: z.string().optional() }).optional(),
    proxy_url: z.string().optional(),
    no_proxy: z.string().optional(),
    proxy_from_environment: z.boolean().optional(),
    follow_redirects: z.boolean().optional(),
    enable_http2: z.boolean().optional(),
    basic_auth: z.looseObject({ username: z.string().optional(), password: z.string().optional() }).optional(),
    tls_config: z
      .looseObject({
        server_name: z.string().optional(),
        insecure_skip_verify: z.boolean().optional(),
        min_version: z.string().optional(),
        max_version: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((httpConfig, ctx) => {
    const authorizationIsConfigured = Boolean(httpConfig.authorization?.credentials);
    const basicAuthIsConfigured = Boolean(httpConfig.basic_auth?.username || httpConfig.basic_auth?.password);
    if (httpConfig.proxy_from_environment && httpConfig.proxy_url) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.sns-proxy-conflict', 'Proxy URL and proxy from environment cannot be used together'),
        path: ['proxy_url'],
      });
    }

    if (authorizationIsConfigured && basicAuthIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.sns-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
    if (httpConfig.authorization?.type && !authorizationIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.sns-authorization-credentials-required', 'Authorization credentials are required'),
        path: ['authorization', 'credentials'],
      });
    }
  });

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
      http_config: SNSHttpConfigFormSchema.optional(),
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
