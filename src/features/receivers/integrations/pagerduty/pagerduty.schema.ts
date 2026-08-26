import { t } from '@grafana/i18n';
import { z } from 'zod';

const PagerDutyHttpConfigFormSchema = z
  .looseObject({
    authorization: z
      .looseObject({
        type: z.string().optional(),
        credentials: z.string().optional(),
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
    const authorizationIsConfigured = Boolean(httpConfig.authorization?.credentials);
    const basicAuthIsConfigured = Boolean(httpConfig.basic_auth?.username || httpConfig.basic_auth?.password);

    if (httpConfig.proxy_from_environment && httpConfig.proxy_url) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.pagerduty-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }

    if (authorizationIsConfigured && basicAuthIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.pagerduty-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }

    if (httpConfig.authorization?.type && !authorizationIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.pagerduty-authorization-credentials-required',
          'Authorization credentials are required'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });

export function createPagerDutySettingsFormSchema() {
  return z.looseObject({
    routing_key: z.string().optional(),
    service_key: z.string().optional(),
    url: z.string().optional(),
    client: z.string().optional(),
    client_url: z.string().optional(),
    description: z.string().optional(),
    severity: z.string().optional(),
    class: z.string().optional(),
    component: z.string().optional(),
    group: z.string().optional(),
    source: z.string().optional(),
    details: z.record(z.string(), z.string()).optional(),
    images: z
      .array(
        z.looseObject({
          src: z.string().optional(),
          href: z.string().optional(),
          alt: z.string().optional(),
        })
      )
      .optional(),
    links: z
      .array(
        z.looseObject({
          href: z.string().optional(),
          text: z.string().optional(),
        })
      )
      .optional(),
    http_config: PagerDutyHttpConfigFormSchema.optional(),
  });
}

export function createPagerDutyIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('pagerduty'),
    sendResolved: z.boolean(),
    settings: createPagerDutySettingsFormSchema(),
  });
}

export type PagerDutySettingsFormValues = z.infer<ReturnType<typeof createPagerDutySettingsFormSchema>>;
