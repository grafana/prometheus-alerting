import type { DiscordConfig } from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultDiscordSettings,
  discordConfigToFormSettings,
  discordFormSettingsToConfig,
} from './discord.mapper';
import { createDiscordSettingsFormSchema } from './discord.schema';
describe('Discord mapper', () => {
  it('round-trips HTTP, hidden, and unknown fields', () => {
    const config = {
      webhook_url_file: '/secret',
      title: 'Alert',
      content: 'hidden',
      http_config: { follow_redirects: false },
      future_option: 'keep',
    } satisfies DiscordConfig;
    expect(discordFormSettingsToConfig(discordConfigToFormSettings(config))).toEqual(config);
  });
  it('requires a webhook URL or file', () => {
    const result = createDiscordSettingsFormSchema().safeParse(createDefaultDiscordSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['webhook_url'] })]));
    }
  });
  it('rejects URL and file together', () => {
    const result = createDiscordSettingsFormSchema().safeParse({ webhook_url: 'secret', webhook_url_file: '/secret' });
    expect(result.success).toBe(false);
  });
});
