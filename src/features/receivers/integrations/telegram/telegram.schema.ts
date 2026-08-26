import { t } from '@grafana/i18n';
import { z } from 'zod';

const TelegramHttpConfigFormSchema = z
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
          'receivers.form.telegram-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (authorizationIsConfigured && basicAuthIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.telegram-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });
const integerString = z.string().superRefine((value, ctx) => {
  if (value !== '' && !/^-?\d+$/.test(value)) {
    ctx.addIssue({ code: 'custom', message: t('receivers.form.telegram-integer-required', 'Enter an integer') });
    return;
  }
  if (value !== '' && !Number.isSafeInteger(Number(value))) {
    ctx.addIssue({
      code: 'custom',
      message: t('receivers.form.telegram-integer-range', 'Enter an integer within the supported safe range'),
    });
  }
});
export function createTelegramSettingsFormSchema(validateForSubmission = true) {
  return z
    .looseObject({
      api_url: z.string().optional(),
      bot_token: z.string().optional(),
      bot_token_file: z.string().optional(),
      chat_id: integerString.refine(
        (value) => value !== '',
        t('receivers.form.telegram-chat-id-required', 'Chat ID is required')
      ),
      message_thread_id: integerString.optional(),
      message: z.string().optional(),
      disable_notifications: z.boolean().optional(),
      parse_mode: z.enum(['', 'MarkdownV2', 'Markdown', 'HTML']).optional(),
      http_config: TelegramHttpConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (validateForSubmission && !settings.bot_token && !settings.bot_token_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.telegram-bot-token-required', 'Bot token is required'),
          path: ['bot_token'],
        });
      }
      if (settings.bot_token && settings.bot_token_file) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.telegram-token-conflict', 'Bot token and bot token file cannot be used together'),
          path: ['bot_token'],
        });
      }
    });
}
export function createTelegramIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('telegram'),
    sendResolved: z.boolean(),
    settings: createTelegramSettingsFormSchema(),
  });
}
export type TelegramSettingsFormValues = z.infer<ReturnType<typeof createTelegramSettingsFormSchema>>;
