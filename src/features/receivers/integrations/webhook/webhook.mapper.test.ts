import type { WebhookConfig } from '@grafana/external-alertmanager/vanilla';

import {
  createDefaultWebhookSettings,
  webhookConfigToFormSettings,
  webhookFormSettingsToConfig,
} from './webhook.mapper';
import { createWebhookSettingsFormSchema } from './webhook.schema';

describe('webhook mapper', () => {
  it('keeps form values aligned with WebhookConfig', () => {
    const settings = webhookConfigToFormSettings({
      url: 'https://example.com/webhook',
      http_config: {
        authorization: { type: 'Bearer', credentials: 'authorization-secret' },
      },
    });

    expect(settings.http_config.authorization).toEqual({
      type: 'Bearer',
      credentials: 'authorization-secret',
    });
  });

  it('round-trips a URL-file-only configuration without crashing the read path', () => {
    const config = { url_file: '/run/secrets/webhook-url' } satisfies WebhookConfig;
    expect(webhookFormSettingsToConfig(webhookConfigToFormSettings(config))).toEqual(config);
  });

  it('converts form strings and omits untouched defaults', () => {
    const settings = createDefaultWebhookSettings();
    settings.url = 'https://example.com/webhook';
    settings.max_alerts = '5';
    settings.http_config.proxy_url = 'https://proxy.example.com';

    expect(webhookFormSettingsToConfig(settings)).toEqual({
      url: 'https://example.com/webhook',
      max_alerts: 5,
      http_config: {
        proxy_url: 'https://proxy.example.com',
      },
    });
  });

  it('preserves unknown fields and migrates a legacy bearer token', () => {
    const original = {
      url: 'https://example.com/webhook',
      future_webhook_setting: 'keep-me',
      http_config: {
        bearer_token: 'legacy-token',
        future_http_setting: 'keep-me-too',
      },
    } satisfies WebhookConfig;

    expect(webhookFormSettingsToConfig(webhookConfigToFormSettings(original))).toEqual({
      url: 'https://example.com/webhook',
      future_webhook_setting: 'keep-me',
      http_config: {
        future_http_setting: 'keep-me-too',
        authorization: { type: 'Bearer', credentials: 'legacy-token' },
      },
    });
  });

  it('migrates a legacy bearer token file when the inline token is empty', () => {
    const original = {
      url: 'https://example.com/webhook',
      http_config: {
        bearer_token: '',
        bearer_token_file: '/var/run/secrets/token',
      },
    } satisfies WebhookConfig;

    expect(webhookFormSettingsToConfig(webhookConfigToFormSettings(original))).toEqual({
      url: 'https://example.com/webhook',
      http_config: {
        authorization: { type: 'Bearer', credentials_file: '/var/run/secrets/token' },
      },
    });
  });

  it('prefers modern authorization when legacy and modern values coexist', () => {
    const original = {
      url: 'https://example.com/webhook',
      http_config: {
        bearer_token: 'legacy-token',
        authorization: { type: 'Custom', credentials: 'modern-token' },
      },
    } satisfies WebhookConfig;

    expect(webhookFormSettingsToConfig(webhookConfigToFormSettings(original)).http_config?.authorization).toEqual({
      type: 'Custom',
      credentials: 'modern-token',
    });
  });

  it('preserves an explicitly changed false TLS value', () => {
    const settings = webhookConfigToFormSettings({
      url: 'https://example.com/webhook',
      http_config: { tls_config: { server_name: 'example.com', insecure_skip_verify: true } },
    });
    settings.http_config.tls_config = {
      ...settings.http_config.tls_config,
      insecure_skip_verify: false,
    };

    expect(webhookFormSettingsToConfig(settings).http_config?.tls_config).toEqual({
      server_name: 'example.com',
      insecure_skip_verify: false,
    });
  });

  it('removes a secret when the password input is cleared', () => {
    const settings = webhookConfigToFormSettings({
      url: 'https://example.com/webhook',
      http_config: { basic_auth: { username: 'user', password: 'secret' } },
    });
    settings.http_config.basic_auth = undefined;

    expect(webhookFormSettingsToConfig(settings).http_config?.basic_auth).toBeUndefined();
  });
});

describe('createWebhookSettingsFormSchema', () => {
  it('rejects invalid max alerts', () => {
    const settings = createDefaultWebhookSettings();
    settings.url = 'https://example.com/webhook';
    settings.max_alerts = '1.5';

    expect(createWebhookSettingsFormSchema().safeParse(settings).success).toBe(false);
  });

  it('rejects proxy URL with proxy from environment', () => {
    const settings = createDefaultWebhookSettings();
    settings.url = 'https://example.com/webhook';
    settings.http_config.proxy_url = 'https://proxy.example.com';
    settings.http_config.proxy_from_environment = true;

    const result = createWebhookSettingsFormSchema().safeParse(settings);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['http_config', 'proxy_url'] })])
      );
    }
  });

  it('rejects OAuth2 combined with another HTTP authentication method', () => {
    const settings = createDefaultWebhookSettings();
    settings.url = 'https://example.com/webhook';
    settings.http_config.authorization = { credentials: 'token' };
    settings.http_config.oauth2 = { client_id: 'client', token_url: 'https://auth.example/token' };

    expect(createWebhookSettingsFormSchema().safeParse(settings).success).toBe(false);
  });

  it('rejects conflicting HTTP authentication methods at the authorization field', () => {
    const settings = createDefaultWebhookSettings();
    settings.url = 'https://example.com/webhook';
    settings.http_config.authorization = { credentials: 'token' };
    settings.http_config.basic_auth = { username: 'user' };

    const result = createWebhookSettingsFormSchema().safeParse(settings);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['http_config', 'authorization', 'credentials'] })])
      );
    }
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('Webhook settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      url_file: '/etc/alerting/webhook',
      payload: { max_alerts: 5 },
    };

    expect(webhookFormSettingsToConfig(webhookConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
