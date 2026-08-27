import type { MSTeamsConfig } from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultMSTeamsSettings,
  msTeamsConfigToFormSettings,
  msTeamsFormSettingsToConfig,
} from './msteams.mapper';
import { createMSTeamsSettingsFormSchema } from './msteams.schema';
describe('Microsoft Teams mapper', () => {
  it('round-trips HTTP, hidden, and unknown fields', () => {
    const config = {
      webhook_url_file: '/secret',
      title: 'Alert',
      summary: 'hidden',
      http_config: { enable_http2: false },
      future_option: 'keep',
    } satisfies MSTeamsConfig;
    expect(msTeamsFormSettingsToConfig(msTeamsConfigToFormSettings(config))).toEqual(config);
  });
  it('requires a webhook URL or file', () => {
    const result = createMSTeamsSettingsFormSchema().safeParse(createDefaultMSTeamsSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['webhook_url'] })]));
    }
  });
});
