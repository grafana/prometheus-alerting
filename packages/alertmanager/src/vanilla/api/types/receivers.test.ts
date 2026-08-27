import { ReceiverSchema } from './receivers';

describe('ReceiverSchema', () => {
  it('preserves unknown fields while parsing a known receiver configuration', () => {
    const receiver = ReceiverSchema.parse({
      name: 'webhook',
      future_receiver_setting: 'receiver-value',
      webhook_configs: [
        {
          url: 'https://example.com/webhook',
          future_webhook_setting: 'webhook-value',
          http_config: {
            follow_redirects: true,
            future_http_setting: 'http-value',
          },
        },
      ],
    });

    expect(receiver).toEqual({
      name: 'webhook',
      future_receiver_setting: 'receiver-value',
      webhook_configs: [
        {
          url: 'https://example.com/webhook',
          future_webhook_setting: 'webhook-value',
          http_config: {
            follow_redirects: true,
            future_http_setting: 'http-value',
          },
        },
      ],
    });
  });

  it('parses Mattermost as a vanilla-only read-only integration', () => {
    expect(
      ReceiverSchema.parse({
        name: 'mattermost',
        mattermost_configs: [
          {
            webhook_url: 'https://mattermost.example.com/hooks/test',
            channel: 'alerts',
            future_mattermost_setting: true,
          },
        ],
      })
    ).toEqual({
      name: 'mattermost',
      mattermost_configs: [
        {
          webhook_url: 'https://mattermost.example.com/hooks/test',
          channel: 'alerts',
          future_mattermost_setting: true,
        },
      ],
    });
  });

  it('still validates fields it knows about', () => {
    expect(() =>
      ReceiverSchema.parse({
        name: 42,
      })
    ).toThrow();
  });
});
