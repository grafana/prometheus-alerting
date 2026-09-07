import { t } from '@grafana/i18n';
import { z } from 'zod';

import { tlsVersionSchema } from './tlsConfig.schema';

type HttpConfigOptions = {
  /**
   * Whether this integration's form offers OAuth2. When it does, OAuth2 joins authorization and
   * basic auth in the "pick one" check and the error message mentions all three.
   */
  oauth2?: boolean;
};

/**
 * The HTTP settings Alertmanager accepts on nearly every integration: how to authenticate, which
 * proxy to use, and how to do TLS.
 *
 * Loose objects throughout, so settings we don't know about survive the trip back to the config.
 */
export function createHttpConfigFormSchema({ oauth2 = false }: HttpConfigOptions = {}) {
  return z
    .looseObject({
      authorization: z
        .looseObject({
          type: z.string().optional(),
          credentials: z.string().optional(),
          credentials_file: z.string().optional(),
        })
        .optional(),
      basic_auth: z
        .looseObject({
          username: z.string().optional(),
          password: z.string().optional(),
          password_file: z.string().optional(),
        })
        .optional(),
      // Alertmanager won't accept an OAuth2 block without a client ID and a token URL, so they are
      // not optional here either.
      oauth2: z
        .looseObject({
          client_id: z.string(),
          client_secret: z.string().optional(),
          client_secret_file: z.string().optional(),
          token_url: z.string(),
        })
        .optional(),
      proxy_url: z.string().optional(),
      no_proxy: z.string().optional(),
      proxy_from_environment: z.boolean().optional(),
      follow_redirects: z.boolean().optional(),
      enable_http2: z.boolean().optional(),
      tls_config: z
        .looseObject({
          server_name: z.string().optional(),
          insecure_skip_verify: z.boolean().optional(),
          min_version: tlsVersionSchema,
          max_version: tlsVersionSchema,
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

      if (httpConfig.proxy_from_environment && httpConfig.proxy_url) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.http-config-proxy-conflict',
            'Proxy URL and proxy from environment cannot be used together'
          ),
          path: ['proxy_url'],
        });
      }

      // "No proxy" lists the hosts to skip, so it only means anything next to a proxy URL.
      // Alertmanager rejects it both on its own and alongside the proxy taken from the environment.
      if (httpConfig.no_proxy && httpConfig.proxy_from_environment) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.http-config-no-proxy-environment-conflict',
            'No proxy and proxy from environment cannot be used together'
          ),
          path: ['no_proxy'],
        });
      } else if (httpConfig.no_proxy && !httpConfig.proxy_url) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.http-config-no-proxy-needs-proxy-url', 'No proxy needs a proxy URL as well'),
          path: ['no_proxy'],
        });
      }

      // Alertmanager keeps basic authentication in its own block, so it refuses to also see it
      // spelled out as an authorization type.
      if (httpConfig.authorization?.type?.trim().toLowerCase() === 'basic') {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.http-config-authorization-type-basic',
            'Authorization type cannot be "basic". Use basic authentication instead.'
          ),
          path: ['authorization', 'type'],
        });
      }

      const configuredAuthMethods = [
        authorizationIsConfigured,
        basicAuthIsConfigured,
        oauth2 && oauth2IsConfigured,
      ].filter(Boolean).length;

      if (configuredAuthMethods > 1) {
        ctx.addIssue({
          code: 'custom',
          message: oauth2
            ? t(
                'receivers.form.http-config-oauth2-conflict',
                'Only one of authorization, basic authentication, or OAuth2 can be used'
              )
            : t(
                'receivers.form.http-config-authentication-conflict',
                'Authorization and basic authentication cannot be used together'
              ),
          path: ['authorization', 'credentials'],
        });
      }

      if (httpConfig.authorization?.type && !authorizationIsConfigured) {
        ctx.addIssue({
          code: 'custom',
          message: t(
            'receivers.form.http-config-authorization-credentials-required',
            'Authorization credentials are required'
          ),
          path: ['authorization', 'credentials'],
        });
      }
    });
}

export type HttpConfigFormValues = z.infer<ReturnType<typeof createHttpConfigFormSchema>>;
