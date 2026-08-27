import {
  getAllIntegrationTypes,
  getIntegrationCount,
  getIntegrationIcon,
  extractIntegrationsFromReceiver,
  INTEGRATION_ICONS,
} from './integrationIcons';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';

describe('getAllIntegrationTypes', () => {
  it('returns every receiver type supported by Alertmanager 0.32.1', () => {
    expect(getAllIntegrationTypes()).toEqual([
      'email',
      'slack',
      'pagerduty',
      'webhook',
      'opsgenie',
      'wechat',
      'pushover',
      'victorops',
      'sns',
      'telegram',
      'discord',
      'webex',
      'msteams',
      'msteamsv2',
      'jira',
      'rocketchat',
      'incidentio',
      'mattermost',
    ]);
  });
});

describe('getIntegrationCount', () => {
  it('returns 0 for a receiver with no configs for that type', () => {
    const receiver: Receiver = { name: 'test' };
    expect(getIntegrationCount(receiver, 'email')).toBe(0);
  });

  it('returns the correct count when configs exist', () => {
    const receiver: Receiver = {
      name: 'test',
      email_configs: [{ to: 'a@b.com' }, { to: 'c@d.com' }],
    };
    expect(getIntegrationCount(receiver, 'email')).toBe(2);
  });
});

describe('getIntegrationIcon', () => {
  it('returns the mapped icon for a known type', () => {
    expect(getIntegrationIcon('email')).toBe(INTEGRATION_ICONS.email);
    expect(getIntegrationIcon('slack')).toBe(INTEGRATION_ICONS.slack);
  });

  it('is case-insensitive', () => {
    expect(getIntegrationIcon('EMAIL')).toBe(INTEGRATION_ICONS.email);
  });

  it('returns default icon for unknown type', () => {
    expect(getIntegrationIcon('unknowntype')).toBe('channel-add');
  });
});

describe('extractIntegrationsFromReceiver', () => {
  it('returns empty array for receiver with no integrations', () => {
    const receiver: Receiver = { name: 'empty' };
    expect(extractIntegrationsFromReceiver(receiver)).toEqual([]);
  });

  it('extracts all configs for a single integration type', () => {
    const receiver: Receiver = {
      name: 'test',
      webhook_configs: [{ url: 'http://a.com' }, { url: 'http://b.com' }],
    };
    const result = extractIntegrationsFromReceiver(receiver);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.type === 'webhook')).toBe(true);
  });

  it('extracts configs across multiple integration types', () => {
    const receiver: Receiver = {
      name: 'multi',
      email_configs: [{ to: 'a@b.com' }],
      slack_configs: [{ channel: '#alerts' }],
    };
    const result = extractIntegrationsFromReceiver(receiver);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.type)).toEqual(expect.arrayContaining(['email', 'slack']));
  });
});
