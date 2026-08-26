import { t } from '@grafana/i18n';
import { z } from 'zod';

const WeChatHttpConfigFormSchema = z
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
          'receivers.form.wechat-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (httpConfig.authorization?.credentials && (httpConfig.basic_auth?.username || httpConfig.basic_auth?.password)) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.wechat-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });

export function createWeChatSettingsFormSchema() {
  return z.looseObject({
    api_url: z.string().optional(),
    corp_id: z.string().optional(),
    agent_id: z.string().optional(),
    api_secret: z.string().optional(),
    to_user: z.string().optional(),
    to_party: z.string().optional(),
    to_tag: z.string().optional(),
    message: z.string().optional(),
    message_type: z.string().optional(),
    http_config: WeChatHttpConfigFormSchema.optional(),
  });
}
export function createWeChatIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('wechat'),
    sendResolved: z.boolean(),
    settings: createWeChatSettingsFormSchema(),
  });
}
export type WeChatSettingsFormValues = z.infer<ReturnType<typeof createWeChatSettingsFormSchema>>;
