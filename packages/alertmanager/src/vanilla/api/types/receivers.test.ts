import { z } from 'zod';

import { ReceiverSchema } from './receivers';
import { describe, it, expect } from '@rstest/core';

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

  /**
   * Alertmanager's YAML reader turns a bare number or boolean into a string, so these are all
   * valid config. We parse the whole configuration in one go, so a single unquoted number used to
   * stop the user opening any of it.
   */
  describe('numbers written without quotes', () => {
    it('reads them as the strings Alertmanager reads them as', () => {
      const receiver = ReceiverSchema.parse({
        name: 'r',
        webhook_configs: [{ url: 'https://example.com/hook', timeout: 0 }],
        pushover_configs: [{ user_key: 'uk', token: 'tk', priority: 1, retry: 0, expire: 0, ttl: 0 }],
        opsgenie_configs: [{ api_key: 'k', priority: 1 }],
        wechat_configs: [{ corp_id: 'c', agent_id: 1 }],
        jira_configs: [{ project: 'P', issue_type: 'Bug', reopen_duration: 0 }],
      });

      expect(receiver.webhook_configs?.[0].timeout).toBe('0');
      expect(receiver.pushover_configs?.[0].priority).toBe('1');
      expect(receiver.pushover_configs?.[0].retry).toBe('0');
      expect(receiver.opsgenie_configs?.[0].priority).toBe('1');
      expect(receiver.wechat_configs?.[0].agent_id).toBe('1');
      expect(receiver.jira_configs?.[0].reopen_duration).toBe('0');
    });

    it('leaves values that are already strings alone', () => {
      const receiver = ReceiverSchema.parse({
        name: 'r',
        webhook_configs: [{ url: 'https://example.com/hook', timeout: '30s' }],
      });

      expect(receiver.webhook_configs?.[0].timeout).toBe('30s');
    });

    // This schema also writes the configuration back out, so the trip has to work both ways.
    it('can be written back out again', () => {
      const receiver = z.decode(ReceiverSchema, {
        name: 'r',
        webhook_configs: [{ url: 'https://example.com/hook', timeout: 0 }],
      });

      expect(z.encode(ReceiverSchema, receiver)).toEqual({
        name: 'r',
        webhook_configs: [{ url: 'https://example.com/hook', timeout: '0' }],
      });
    });
  });
});
