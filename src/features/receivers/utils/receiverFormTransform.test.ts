import { HTTPConfigSchema, type Receiver } from '@grafana/external-alertmanager/vanilla';

import {
  CLOUD_INTEGRATION_TYPES,
  createDefaultIntegration,
  formValuesToReceiver,
  receiverToFormValues,
} from './receiverFormTransform';

describe('CLOUD_INTEGRATION_TYPES', () => {
  it("matches Grafana core's Mimir/Prometheus Alertmanager UI", () => {
    expect(CLOUD_INTEGRATION_TYPES).toEqual([
      'email',
      'webhook',
      'slack',
      'pagerduty',
      'opsgenie',
      'discord',
      'msteams',
      'jira',
      'telegram',
      'pushover',
      'victorops',
      'sns',
      'webex',
      'wechat',
    ]);
  });
});

describe('HTTPConfigSchema', () => {
  it('preserves deprecated bearer-token fields until a receiver-specific mapper handles them', () => {
    expect(HTTPConfigSchema.parse({ bearer_token: 'legacy-token' })).toEqual({ bearer_token: 'legacy-token' });
    expect(HTTPConfigSchema.parse({ bearer_token: '', bearer_token_file: '/var/run/secrets/token' })).toEqual({
      bearer_token: '',
      bearer_token_file: '/var/run/secrets/token',
    });
  });
});

describe('receiver form transformations', () => {
  it('keeps a Webex legacy bearer token out of form input and migrates it on save without mutating input', () => {
    const receiver = {
      name: 'webex',
      webex_configs: [
        {
          room_id: 'room-id',
          http_config: { bearer_token: 'legacy-token' },
        },
      ],
    } satisfies Receiver;

    const values = receiverToFormValues(receiver);
    const integration = values.integrations[0];

    expect(integration.type).toBe('webex');
    if (integration.type === 'webex') {
      expect(integration.settings.http_config.authorization).toEqual({
        type: 'Bearer',
        credentials: 'legacy-token',
      });
    }
    expect(formValuesToReceiver(values)).toEqual({
      name: 'webex',
      webex_configs: [
        {
          send_resolved: true,
          room_id: 'room-id',
          http_config: {
            authorization: { type: 'Bearer', credentials: 'legacy-token' },
          },
        },
      ],
    });
    expect(receiver.webex_configs[0].http_config).toEqual({ bearer_token: 'legacy-token' });
  });

  it('round-trips an existing Jira integration without adding optional defaults', () => {
    const receiver = {
      name: 'jira',
      jira_configs: [
        {
          project: 'OPS',
          summary: 'Alert summary',
          description: 'Alert description',
        },
      ],
    } satisfies Receiver;

    expect(formValuesToReceiver(receiverToFormValues(receiver))).toEqual({
      name: 'jira',
      jira_configs: [
        {
          send_resolved: true,
          project: 'OPS',
          summary: 'Alert summary',
          description: 'Alert description',
        },
      ],
    });
  });

  it('uses Alertmanager send-resolved defaults for Slack and WeChat', () => {
    const receiver = {
      name: 'defaults',
      slack_configs: [{ channel: '#alerts' }],
      wechat_configs: [{ corp_id: 'corp' }],
    } satisfies Receiver;

    expect(
      receiverToFormValues(receiver).integrations.map(({ type, sendResolved }) => ({ type, sendResolved }))
    ).toEqual([
      { type: 'slack', sendResolved: false },
      { type: 'wechat', sendResolved: false },
    ]);
  });

  it('preserves non-editable integrations and unknown receiver fields on edit', () => {
    const receiver = {
      name: 'mixed',
      webhook_configs: [{ url: 'https://example.test' }],
      msteamsv2_configs: [{ webhook_url: 'https://teams.example' }],
      future_receiver_option: { enabled: true },
    } satisfies Receiver;

    expect(formValuesToReceiver(receiverToFormValues(receiver))).toEqual({
      name: 'mixed',
      webhook_configs: [{ url: 'https://example.test', send_resolved: true }],
      msteamsv2_configs: [{ webhook_url: 'https://teams.example' }],
      future_receiver_option: { enabled: true },
    });
  });

  it('serializes a newly configured Webex integration with modern authorization', () => {
    const integration = createDefaultIntegration('webex');
    if (integration.type !== 'webex') {
      throw new Error('Expected a Webex integration');
    }
    integration.settings.room_id = 'room-id';
    integration.settings.http_config.authorization = {
      type: 'Bearer',
      credentials: 'modern-token',
    };

    expect(formValuesToReceiver({ name: 'webex', integrations: [integration] })).toEqual({
      name: 'webex',
      webex_configs: [
        {
          send_resolved: true,
          room_id: 'room-id',
          http_config: {
            authorization: { type: 'Bearer', credentials: 'modern-token' },
          },
        },
      ],
    });
  });

  it('omits untouched optional Webhook HTTP configuration', () => {
    const integration = createDefaultIntegration('webhook');
    if (integration.type !== 'webhook') {
      throw new Error('Expected a Webhook integration');
    }
    integration.settings.url = 'https://example.com/webhook';

    expect(formValuesToReceiver({ name: 'webhook', integrations: [integration] })).toEqual({
      name: 'webhook',
      webhook_configs: [
        {
          send_resolved: true,
          url: 'https://example.com/webhook',
        },
      ],
    });
  });
});
