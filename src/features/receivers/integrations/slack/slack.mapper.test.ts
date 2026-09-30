import type { SlackConfig } from '@grafana/external-alertmanager/vanilla';

import { createDefaultSlackSettings, slackConfigToFormSettings, slackFormSettingsToConfig } from './slack.mapper';
import { createSlackSettingsFormSchema } from './slack.schema';

describe('Slack mapper', () => {
  it('round-trips API-shaped arrays, actions, unknown, and unrendered fields', () => {
    const config = {
      api_url: 'https://hooks.slack.com/services/secret',
      channel: '#alerts',
      mrkdwn_in: ['text', 'pretext'],
      fields: [{ title: 'Environment', value: 'production', short: true }],
      actions: [
        {
          type: 'button',
          text: 'Open',
          url: 'https://example.com',
          confirm: { title: 'Confirm', text: 'Open incident?' },
        },
      ],
      http_config: { follow_redirects: false },
      future_slack_option: 'keep',
    } satisfies SlackConfig;

    expect(slackFormSettingsToConfig(slackConfigToFormSettings(config))).toEqual(config);
  });

  it('round-trips a configuration that relies on Alertmanager channel defaults', () => {
    const config = { api_url_file: '/run/secrets/slack-url' } satisfies SlackConfig;
    expect(slackFormSettingsToConfig(slackConfigToFormSettings(config))).toEqual(config);
  });

  it('requires a channel', () => {
    const result = createSlackSettingsFormSchema().safeParse(createDefaultSlackSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['channel'] })]));
    }
  });

  it('rejects webhook URL with webhook URL file', () => {
    const settings = createDefaultSlackSettings();
    settings.channel = '#alerts';
    settings.api_url = 'https://hooks.slack.com/services/secret';
    settings.api_url_file = '/var/run/secrets/slack';

    const result = createSlackSettingsFormSchema().safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['api_url'] })]));
    }
  });

  it('rejects proxy and HTTP authentication conflicts', () => {
    const settings = createDefaultSlackSettings();
    settings.channel = '#alerts';
    settings.http_config = {
      proxy_url: 'https://proxy.example.com',
      proxy_from_environment: true,
      authorization: { credentials: 'token' },
      basic_auth: { username: 'user' },
    };

    const result = createSlackSettingsFormSchema().safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([
          ['http_config', 'proxy_url'],
          ['http_config', 'authorization', 'credentials'],
        ])
      );
    }
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('Slack settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      channel: '#alerts',
      api_url_file: '/etc/alerting/slack',
      app_token: 'xoxb-token',
      app_token_file: '/etc/alerting/app-token',
      app_url: 'https://slack.com/api/chat.postMessage',
      message_text: 'A message body',
      fields: [{ title: 'Env', value: 'prod' }],
      update_message: true,
      timeout: '10s',
    };

    expect(slackFormSettingsToConfig(slackConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
