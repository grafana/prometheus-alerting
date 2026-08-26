import { t } from '@grafana/i18n';
import { z } from 'zod';

const VictorOpsHttpConfigFormSchema = z
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
          'receivers.form.victorops-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (authorizationIsConfigured && basicAuthIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.victorops-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });
export function createVictorOpsSettingsFormSchema(validateForSubmission = true) {
  return z
    .looseObject({
      api_key: z.string().optional(),
      api_key_file: z.string().optional(),
      api_url: z.string().optional(),
      routing_key: z
        .string()
        .trim()
        .min(1, t('receivers.form.victorops-routing-key-required', 'Routing key is required')),
      message_type: z.string().optional(),
      entity_display_name: z.string().optional(),
      state_message: z.string().optional(),
      monitoring_tool: z.string().optional(),
      custom_fields: z.record(z.string(), z.string()).optional(),
      http_config: VictorOpsHttpConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (validateForSubmission && !settings.api_key && !settings.api_key_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.victorops-api-key-required', 'API key is required'),
          path: ['api_key'],
        });
      }
      if (
        validateForSubmission &&
        settings.message_type &&
        !['CRITICAL', 'WARNING', 'INFO'].includes(settings.message_type) &&
        !settings.message_type.includes('{{')
      ) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.victorops-message-type-invalid',
            'Message type must be CRITICAL, WARNING, or INFO'
          ),
          path: ['message_type'],
        });
      }
      if (settings.api_key && settings.api_key_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.victorops-api-key-conflict', 'API key and API key file cannot be used together'),
          path: ['api_key'],
        });
      }
    });
}
export function createVictorOpsIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('victorops'),
    sendResolved: z.boolean(),
    settings: createVictorOpsSettingsFormSchema(),
  });
}
export type VictorOpsSettingsFormValues = z.infer<ReturnType<typeof createVictorOpsSettingsFormSchema>>;
