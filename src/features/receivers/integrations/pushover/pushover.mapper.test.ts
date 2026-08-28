import type { PushoverConfig } from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultPushoverSettings,
  pushoverConfigToFormSettings,
  pushoverFormSettingsToConfig,
} from './pushover.mapper';
import { createPushoverSettingsFormSchema } from './pushover.schema';
describe('Pushover mapper', () => {
  it('round-trips hidden and unknown fields', () => {
    const config = {
      user_key: 'user',
      token: 'token',
      ttl: '5m30s',
      sound: 'siren',
      html: true,
      http_config: { follow_redirects: false },
      future_option: 'keep',
    } satisfies PushoverConfig;
    expect(pushoverFormSettingsToConfig(pushoverConfigToFormSettings(config))).toEqual(config);
  });
  it('requires user key and token', () => {
    const result = createPushoverSettingsFormSchema().safeParse(createDefaultPushoverSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([['user_key'], ['token']]));
    }
  });
  it('rejects unsupported priorities', () => {
    const settings = createDefaultPushoverSettings();
    settings.user_key = 'user';
    settings.token = 'token';
    settings.priority = '3';
    expect(createPushoverSettingsFormSchema().safeParse(settings).success).toBe(false);
  });
  it('rejects invalid TTL', () => {
    const settings = createDefaultPushoverSettings();
    settings.user_key = 'user';
    settings.token = 'token';
    settings.ttl = 'tomorrow';
    expect(createPushoverSettingsFormSchema().safeParse(settings).success).toBe(false);
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('Pushover settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      user_key_file: '/etc/alerting/user',
      token_file: '/etc/alerting/token',
    };

    expect(pushoverFormSettingsToConfig(pushoverConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
