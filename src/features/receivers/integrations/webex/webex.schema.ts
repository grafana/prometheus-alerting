import { t } from '@grafana/i18n';
import { z } from 'zod';

function createWebexHttpConfigFormSchema(validateForSubmission: boolean) {
  return z
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
      const basicAuthIsConfigured = Boolean(httpConfig.basic_auth?.username || httpConfig.basic_auth?.password);

      if (validateForSubmission && !authorizationIsConfigured) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.webex-authorization-required', 'Webex authorization credentials are required'),
          path: ['authorization', 'credentials'],
        });
      }

      if (httpConfig.proxy_from_environment && httpConfig.proxy_url) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.webex-proxy-conflict',
            'Proxy URL and proxy from environment cannot be used together'
          ),
          path: ['proxy_url'],
        });
      }

      if (authorizationIsConfigured && basicAuthIsConfigured) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.webex-authentication-conflict',
            'Authorization and basic authentication cannot be used together'
          ),
          path: ['authorization', 'credentials'],
        });
      }
    });
}

export function createWebexSettingsFormSchema(validateForSubmission = true) {
  return z.looseObject({
    api_url: z.string().optional(),
    room_id: z.string().trim().min(1, t('receivers.form.webex-room-id-required', 'Room ID is required')),
    message: z.string().optional(),
    http_config: createWebexHttpConfigFormSchema(validateForSubmission),
  });
}

export function createWebexIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('webex'),
    sendResolved: z.boolean(),
    settings: createWebexSettingsFormSchema(),
  });
}

export type WebexSettingsFormValues = z.infer<ReturnType<typeof createWebexSettingsFormSchema>>;
