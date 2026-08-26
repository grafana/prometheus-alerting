import { t } from '@grafana/i18n';
import { z } from 'zod';

const DiscordHttpConfigFormSchema = z
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
    if (httpConfig.proxy_from_environment && httpConfig.proxy_url) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.discord-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (httpConfig.authorization?.credentials && (httpConfig.basic_auth?.username || httpConfig.basic_auth?.password)) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.discord-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });

export function createDiscordSettingsFormSchema() {
  return z
    .looseObject({
      webhook_url: z.string().optional(),
      webhook_url_file: z.string().optional(),
      title: z.string().optional(),
      message: z.string().optional(),
      content: z.string().optional(),
      username: z.string().optional(),
      avatar_url: z.string().optional(),
      http_config: DiscordHttpConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (!settings.webhook_url && !settings.webhook_url_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.discord-webhook-required', 'Webhook URL is required'),
          path: ['webhook_url'],
        });
      }
      if (settings.webhook_url && settings.webhook_url_file) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.discord-webhook-conflict',
            'Webhook URL and webhook URL file cannot be used together'
          ),
          path: ['webhook_url'],
        });
      }
    });
}
export function createDiscordIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('discord'),
    sendResolved: z.boolean(),
    settings: createDiscordSettingsFormSchema(),
  });
}
export type DiscordSettingsFormValues = z.infer<ReturnType<typeof createDiscordSettingsFormSchema>>;
