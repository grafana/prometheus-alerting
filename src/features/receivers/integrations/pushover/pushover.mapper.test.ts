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
