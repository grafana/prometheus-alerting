import { t } from '@grafana/i18n';
import { z } from 'zod';

const PushoverHttpConfigFormSchema = z
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
        message: t(
          'receivers.form.pushover-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (authorizationIsConfigured && basicAuthIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.pushover-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });
function createDurationSchema() {
  return z
    .string()
    .regex(/^(\d+[smh])+$/, t('receivers.form.pushover-duration-invalid', 'Enter a duration such as 30s, 5m30s, or 8h'))
    .or(z.literal(''))
    .optional();
}
export function createPushoverSettingsFormSchema(validateForSubmission = true) {
  return z
    .looseObject({
      user_key: z.string().optional(),
      user_key_file: z.string().optional(),
      token: z.string().optional(),
      token_file: z.string().optional(),
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
      http_config: PushoverHttpConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (validateForSubmission && !settings.user_key && !settings.user_key_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.pushover-user-key-required', 'User key is required'),
          path: ['user_key'],
        });
      }
      if (validateForSubmission && !settings.token && !settings.token_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.pushover-token-required', 'Token is required'),
          path: ['token'],
        });
      }
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
      if (settings.user_key && settings.user_key_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.pushover-user-key-conflict', 'User key and user key file cannot be used together'),
          path: ['user_key'],
        });
      }
      if (settings.token && settings.token_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.pushover-token-conflict', 'Token and token file cannot be used together'),
          path: ['token'],
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
