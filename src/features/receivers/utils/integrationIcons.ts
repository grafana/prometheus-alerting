import type { IconName } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { JsonValue } from 'type-fest';
import { z } from 'zod';

/**
 * Mapping of integration types to their corresponding config property names in a Receiver object.
 * The explicit list remains stable even though the read-only receiver schema permits future keys.
 */
const INTEGRATION_CONFIG_KEYS = {
  email: 'email_configs',
  slack: 'slack_configs',
  pagerduty: 'pagerduty_configs',
  webhook: 'webhook_configs',
  opsgenie: 'opsgenie_configs',
  wechat: 'wechat_configs',
  pushover: 'pushover_configs',
  victorops: 'victorops_configs',
  sns: 'sns_configs',
  telegram: 'telegram_configs',
  discord: 'discord_configs',
  webex: 'webex_configs',
  msteams: 'msteams_configs',
  msteamsv2: 'msteamsv2_configs',
  jira: 'jira_configs',
  rocketchat: 'rocketchat_configs',
  incidentio: 'incidentio_configs',
  mattermost: 'mattermost_configs',
} as const satisfies Record<string, keyof Receiver>;

export type IntegrationType = keyof typeof INTEGRATION_CONFIG_KEYS;

/**
 * Maps integration types to their corresponding Grafana icon names.
 */
export const INTEGRATION_ICONS: Record<IntegrationType, IconName> = {
  email: 'envelope',
  slack: 'slack',
  pagerduty: 'pagerduty',
  webhook: 'link',
  opsgenie: 'bug',
  wechat: 'comments-alt',
  pushover: 'mobile-android',
  victorops: 'bell',
  sns: 'amazon',
  telegram: 'telegram-alt',
  discord: 'discord',
  webex: 'comments-alt',
  msteams: 'microsoft',
  msteamsv2: 'microsoft',
  jira: 'bug',
  rocketchat: 'rocket',
  incidentio: 'fire',
  mattermost: 'comments-alt',
};

const JsonRecordSchema = z.record(z.string(), z.json());

/**
 * Returns all supported integration types.
 */
export function getAllIntegrationTypes(): IntegrationType[] {
  return Object.keys(INTEGRATION_ICONS) as IntegrationType[];
}

/**
 * Gets all integration configs from a receiver, returning an array of typed configs.
 * @param receiver - The Receiver object to extract integrations from
 * @returns An array of integration objects with type and config
 */
export function extractIntegrationsFromReceiver(
  receiver: Receiver
): Array<{ type: IntegrationType; config: Record<string, JsonValue> }> {
  const integrations: Array<{ type: IntegrationType; config: Record<string, JsonValue> }> = [];

  for (const type of getAllIntegrationTypes()) {
    const configKey = INTEGRATION_CONFIG_KEYS[type];
    const configs = receiver[configKey];

    if (configs && Array.isArray(configs)) {
      configs.forEach((config) => {
        const parsedConfig = JsonRecordSchema.safeParse(config);
        if (parsedConfig.success) {
          integrations.push({ type, config: parsedConfig.data });
        }
      });
    }
  }

  return integrations;
}

/**
 * Gets the count of integrations for a specific type in a receiver.
 * @param receiver - The Receiver object
 * @param type - The integration type
 * @returns The count of configs for that type
 */
export function getIntegrationCount(receiver: Receiver, type: IntegrationType): number {
  const configKey = INTEGRATION_CONFIG_KEYS[type];
  const configs = receiver[configKey];
  return Array.isArray(configs) ? configs.length : 0;
}

/**
 * Gets the icon name for a given integration type.
 * Returns a default icon if the type is not found.
 */
export function getIntegrationIcon(integrationType: string): IconName {
  const key = integrationType.toLowerCase() as IntegrationType;
  return INTEGRATION_ICONS[key] ?? 'channel-add';
}
