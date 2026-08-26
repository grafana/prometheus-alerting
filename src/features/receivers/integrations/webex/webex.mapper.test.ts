import type { WebexConfig } from '@grafana/external-alertmanager/vanilla';

import { createDefaultWebexSettings, webexConfigToFormSettings, webexFormSettingsToConfig } from './webex.mapper';
import { createWebexSettingsFormSchema } from './webex.schema';

describe('webex mapper', () => {
  it('keeps form values aligned with WebexConfig', () => {
    const settings = webexConfigToFormSettings({
      room_id: 'room',
      http_config: { authorization: { type: 'Bearer', credentials: 'secret' } },
    });

    expect(settings.http_config.authorization).toEqual({ type: 'Bearer', credentials: 'secret' });
  });

  it('round-trips authorization credentials supplied by a hidden file', () => {
    const config = {
      room_id: 'room-id',
      http_config: { authorization: { type: 'Bearer', credentials_file: '/run/secrets/webex-token' } },
    } satisfies WebexConfig;
    expect(webexFormSettingsToConfig(webexConfigToFormSettings(config))).toEqual(config);
  });

  it('migrates a legacy bearer token and preserves unknown fields', () => {
    const original = {
      room_id: 'room',
      future_webex_setting: 'keep',
      http_config: { bearer_token: 'legacy', future_http_setting: 'keep-too' },
    } satisfies WebexConfig;

    expect(webexFormSettingsToConfig(webexConfigToFormSettings(original))).toEqual({
      room_id: 'room',
      future_webex_setting: 'keep',
      http_config: {
        future_http_setting: 'keep-too',
        authorization: { type: 'Bearer', credentials: 'legacy' },
      },
    });
  });

  it('preserves unrendered TLS material losslessly', () => {
    const original = {
      room_id: 'room',
      http_config: {
        authorization: { type: 'Bearer', credentials: 'secret' },
        tls_config: {
          ca: 'inline-ca',
          cert_file: '/etc/cert.pem',
          key_file: '/etc/key.pem',
        },
      },
    } satisfies WebexConfig;

    expect(webexFormSettingsToConfig(webexConfigToFormSettings(original)).http_config?.tls_config).toEqual(
      original.http_config.tls_config
    );
  });

  it('preserves an explicitly changed false TLS value', () => {
    const settings = webexConfigToFormSettings({
      room_id: 'room',
      http_config: {
        authorization: { type: 'Bearer', credentials: 'secret' },
        tls_config: { server_name: 'example.com', insecure_skip_verify: true },
      },
    });
    settings.http_config.tls_config = {
      ...settings.http_config.tls_config,
      insecure_skip_verify: false,
    };

    expect(webexFormSettingsToConfig(settings).http_config?.tls_config).toEqual({
      server_name: 'example.com',
      insecure_skip_verify: false,
    });
  });

  it('serializes modern authorization', () => {
    const settings = createDefaultWebexSettings();
    settings.room_id = 'room';
    settings.http_config.authorization = { type: 'Bearer', credentials: 'new-token' };

    expect(webexFormSettingsToConfig(settings)).toEqual({
      room_id: 'room',
      http_config: { authorization: { type: 'Bearer', credentials: 'new-token' } },
    });
  });
});

describe('createWebexSettingsFormSchema', () => {
  it('requires room ID and authorization credentials', () => {
    const result = createWebexSettingsFormSchema().safeParse(createDefaultWebexSettings());

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['room_id'], ['http_config', 'authorization', 'credentials']])
      );
    }
  });

  it('rejects basic authentication combined with authorization', () => {
    const settings = createDefaultWebexSettings();
    settings.room_id = 'room';
    settings.http_config.authorization = { credentials: 'token' };
    settings.http_config.basic_auth = { username: 'user' };

    const result = createWebexSettingsFormSchema().safeParse(settings);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['http_config', 'authorization', 'credentials'] })])
      );
    }
  });
});
