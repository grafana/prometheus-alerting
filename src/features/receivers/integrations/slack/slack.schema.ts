import { t } from '@grafana/i18n';
import { z } from 'zod';

const SlackHttpConfigFormSchema = z
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
          'receivers.form.slack-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (authorizationIsConfigured && basicAuthIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.slack-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
    if (httpConfig.authorization?.type && !authorizationIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.slack-authorization-credentials-required', 'Authorization credentials are required'),
        path: ['authorization', 'credentials'],
      });
    }
  });

const SlackActionFormSchema = z.looseObject({
  type: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  style: z.string().optional(),
  name: z.string().optional(),
  value: z.string().optional(),
  confirm: z
    .looseObject({
      title: z.string().optional(),
      text: z.string().optional(),
      ok_text: z.string().optional(),
      dismiss_text: z.string().optional(),
    })
    .optional(),
});

export function createSlackSettingsFormSchema(validateForSubmission = true) {
  return z
    .looseObject({
      api_url: z.string().optional(),
      api_url_file: z.string().optional(),
      channel: z.string().optional(),
      username: z.string().optional(),
      color: z.string().optional(),
      title: z.string().optional(),
      title_link: z.string().optional(),
      pretext: z.string().optional(),
      text: z.string().optional(),
      short_fields: z.boolean().optional(),
      footer: z.string().optional(),
      fallback: z.string().optional(),
      callback_id: z.string().optional(),
      icon_emoji: z.string().optional(),
      icon_url: z.string().optional(),
      image_url: z.string().optional(),
      thumb_url: z.string().optional(),
      link_names: z.boolean().optional(),
      mrkdwn_in: z.array(z.string()).optional(),
      actions: z.array(SlackActionFormSchema).optional(),
      http_config: SlackHttpConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (validateForSubmission && !settings.channel?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.slack-channel-required', 'Channel is required'),
          path: ['channel'],
        });
      }
      if (settings.api_url && settings.api_url_file) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.slack-api-url-conflict',
            'Webhook URL and webhook URL file cannot be used together'
          ),
          path: ['api_url'],
        });
      }
    });
}

export function createSlackIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('slack'),
    sendResolved: z.boolean(),
    settings: createSlackSettingsFormSchema(),
  });
}

export type SlackSettingsFormValues = z.infer<ReturnType<typeof createSlackSettingsFormSchema>>;
