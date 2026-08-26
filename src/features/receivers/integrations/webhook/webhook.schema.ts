import { t } from '@grafana/i18n';
import { z } from 'zod';

const WebhookHttpConfigFormSchema = z
  .looseObject({
    authorization: z
      .looseObject({
        type: z.string().optional(),
        credentials: z.string().optional(),
        credentials_file: z.string().optional(),
      })
      .optional(),
    proxy_url: z.string().optional(),
    no_proxy: z.string().optional(),
    proxy_from_environment: z.boolean().optional(),
    follow_redirects: z.boolean().optional(),
    enable_http2: z.boolean().optional(),
    basic_auth: z
      .looseObject({
        username: z.string().optional(),
        password: z.string().optional(),
        password_file: z.string().optional(),
      })
      .optional(),
    oauth2: z
      .looseObject({
        client_id: z.string(),
        client_secret: z.string().optional(),
        client_secret_file: z.string().optional(),
        token_url: z.string(),
      })
      .optional(),
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
    const authorizationIsConfigured = Boolean(
      httpConfig.authorization?.credentials || httpConfig.authorization?.credentials_file
    );
    const basicAuthIsConfigured = Boolean(
      httpConfig.basic_auth?.username || httpConfig.basic_auth?.password || httpConfig.basic_auth?.password_file
    );
    const oauth2IsConfigured = Boolean(
      httpConfig.oauth2?.client_id ||
      httpConfig.oauth2?.client_secret ||
      httpConfig.oauth2?.client_secret_file ||
      httpConfig.oauth2?.token_url
    );

    if ([authorizationIsConfigured, basicAuthIsConfigured, oauth2IsConfigured].filter(Boolean).length > 1) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.webhook-authentication-conflict',
          'Only one of authorization, basic authentication, or OAuth2 can be used'
        ),
        path: ['authorization', 'credentials'],
      });
    }

    if (httpConfig.proxy_from_environment && httpConfig.proxy_url) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.webhook-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }

    if (httpConfig.authorization?.type && !authorizationIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.webhook-authorization-credentials-required',
          'Authorization credentials are required'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });

export function createWebhookSettingsFormSchema() {
  return z
    .looseObject({
      url: z.string().optional(),
      url_file: z.string().optional(),
      max_alerts: z.string().superRefine((value, ctx) => {
        if (value === '') {
          return;
        }
        const parsed = Number(value);
        if (!Number.isSafeInteger(parsed) || parsed < 0) {
          ctx.addIssue({
            code: 'custom',
            message: t('receivers.form.webhook-max-alerts-invalid', 'Max alerts must be a non-negative integer'),
          });
        }
      }),
      timeout: z.string().optional(),
      http_config: WebhookHttpConfigFormSchema,
    })
    .superRefine((settings, ctx) => {
      if (!settings.url && !settings.url_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.webhook-url-required', 'Webhook URL is required'),
          path: ['url'],
        });
      }
      if (settings.url && settings.url_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.webhook-url-conflict', 'Webhook URL and URL file cannot be used together'),
          path: ['url'],
        });
      }
    });
}

export function createWebhookIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('webhook'),
    sendResolved: z.boolean(),
    settings: createWebhookSettingsFormSchema(),
  });
}

export type WebhookSettingsFormValues = z.infer<ReturnType<typeof createWebhookSettingsFormSchema>>;
