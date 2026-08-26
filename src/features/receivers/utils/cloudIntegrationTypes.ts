import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

/** Receiver integrations exposed by Grafana core's Mimir/Prometheus Alertmanager UI. */
export const CLOUD_INTEGRATION_TYPES = [
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
] as const;

export const LEGACY_INTEGRATION_TYPES = ['telegram', 'discord', 'msteams', 'wechat', 'jira'] as const;

export type CloudIntegrationType = (typeof CLOUD_INTEGRATION_TYPES)[number];

export function isCloudIntegrationType(value: string): value is CloudIntegrationType {
  return CLOUD_INTEGRATION_TYPES.some((type) => type === value);
}

export function getCloudIntegrationTypeOptions(): Array<{
  label: string;
  value: CloudIntegrationType;
  description: string;
}> {
  return [
    {
      label: t('receivers.integration.email', 'Email'),
      value: 'email',
      description: t('receivers.integration.email-description', 'Send notifications by email'),
    },
    {
      label: t('receivers.integration.webhook', 'Webhook'),
      value: 'webhook',
      description: t('receivers.integration.webhook-description', 'Send notifications to an HTTP endpoint'),
    },
    {
      label: t('receivers.integration.slack', 'Slack'),
      value: 'slack',
      description: t('receivers.integration.slack-description', 'Send notifications to Slack'),
    },
    {
      label: t('receivers.integration.pagerduty', 'PagerDuty'),
      value: 'pagerduty',
      description: t('receivers.integration.pagerduty-description', 'Send notifications to PagerDuty'),
    },
    {
      label: t('receivers.integration.opsgenie', 'OpsGenie'),
      value: 'opsgenie',
      description: t('receivers.integration.opsgenie-description', 'Send notifications to OpsGenie'),
    },
    {
      label: t('receivers.integration.discord', 'Discord'),
      value: 'discord',
      description: t('receivers.integration.discord-description', 'Send notifications to Discord'),
    },
    {
      label: t('receivers.integration.msteams', 'Microsoft Teams'),
      value: 'msteams',
      description: t('receivers.integration.msteams-description', 'Send notifications to Microsoft Teams'),
    },
    {
      label: t('receivers.integration.jira', 'Jira'),
      value: 'jira',
      description: t('receivers.integration.jira-description', 'Send notifications to Jira Service Management'),
    },
    {
      label: t('receivers.integration.telegram', 'Telegram'),
      value: 'telegram',
      description: t('receivers.integration.telegram-description', 'Send notifications to Telegram'),
    },
    {
      label: t('receivers.integration.pushover', 'Pushover'),
      value: 'pushover',
      description: t('receivers.integration.pushover-description', 'Send notifications to Pushover'),
    },
    {
      label: t('receivers.integration.victorops', 'VictorOps'),
      value: 'victorops',
      description: t('receivers.integration.victorops-description', 'Send notifications to VictorOps'),
    },
    {
      label: t('receivers.integration.sns', 'Amazon SNS'),
      value: 'sns',
      description: t('receivers.integration.sns-description', 'Send notifications to Amazon SNS'),
    },
    {
      label: t('receivers.integration.webex', 'Cisco Webex Teams'),
      value: 'webex',
      description: t('receivers.integration.webex-description', 'Send notifications to Cisco Webex Teams'),
    },
    {
      label: t('receivers.integration.wechat', 'WeChat'),
      value: 'wechat',
      description: t('receivers.integration.wechat-description', 'Send notifications to WeChat'),
    },
  ];
}

export const INTEGRATION_TYPE_MAP = {
  email: 'email_configs',
  webhook: 'webhook_configs',
  slack: 'slack_configs',
  pagerduty: 'pagerduty_configs',
  opsgenie: 'opsgenie_configs',
  discord: 'discord_configs',
  msteams: 'msteams_configs',
  jira: 'jira_configs',
  telegram: 'telegram_configs',
  pushover: 'pushover_configs',
  victorops: 'victorops_configs',
  sns: 'sns_configs',
  webex: 'webex_configs',
  wechat: 'wechat_configs',
} as const satisfies Record<CloudIntegrationType, keyof Receiver>;
