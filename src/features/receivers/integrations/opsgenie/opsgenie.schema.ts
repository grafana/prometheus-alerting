import { t } from '@grafana/i18n';
import { z } from 'zod';

const OpsgenieHttpConfigFormSchema = z
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
          'receivers.form.opsgenie-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (authorizationIsConfigured && basicAuthIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.opsgenie-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
    if (httpConfig.authorization?.type && !authorizationIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.opsgenie-authorization-credentials-required',
          'Authorization credentials are required'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });

const OpsgenieResponderFormSchema = z.looseObject({
  id: z.string().optional(),
  name: z.string().optional(),
  username: z.string().optional(),
  type: z.string().optional(),
});

export function createOpsgenieSettingsFormSchema(validateRequired = true) {
  return z
    .looseObject({
      api_key: z.string().optional(),
      api_key_file: z.string().optional(),
      api_url: z.string().optional(),
      message: z
        .string()
        .max(130, t('receivers.form.opsgenie-message-too-long', 'Message must be at most 130 characters'))
        .optional(),
      description: z.string().optional(),
      source: z.string().optional(),
      details: z.record(z.string(), z.string()).optional(),
      responders: z.array(OpsgenieResponderFormSchema).optional(),
      tags: z.string().optional(),
      note: z.string().optional(),
      priority: z.string().optional(),
      entity: z.string().optional(),
      actions: z.string().optional(),
      update_alerts: z.boolean().optional(),
      http_config: OpsgenieHttpConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (validateRequired && !settings.api_key && !settings.api_key_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.opsgenie-api-key-required', 'API key is required'),
          path: ['api_key'],
        });
      }
      if (
        validateRequired &&
        settings.priority &&
        !/^P[1-5]$/.test(settings.priority) &&
        !settings.priority.includes('{{')
      ) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.opsgenie-priority-invalid', 'Priority must be P1, P2, P3, P4, or P5'),
          path: ['priority'],
        });
      }
      if (settings.api_key && settings.api_key_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.opsgenie-api-key-conflict', 'API key and API key file cannot be used together'),
          path: ['api_key'],
        });
      }
    });
}
export function createOpsgenieIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('opsgenie'),
    sendResolved: z.boolean(),
    settings: createOpsgenieSettingsFormSchema(),
  });
}
export type OpsgenieSettingsFormValues = z.infer<ReturnType<typeof createOpsgenieSettingsFormSchema>>;
