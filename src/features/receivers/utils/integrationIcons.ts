import type { IconName } from '@grafana/ui';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { JsonValue } from 'type-fest';

/**
 * Extract integration type names from Receiver config keys
 * e.g., "email_configs" -> "email"
 */
type ReceiverConfigKeys = keyof Receiver;
type ExtractIntegrationName<T extends string> = T extends `${infer Name}_configs` ? Name : never;
type AllIntegrationTypes = ExtractIntegrationName<ReceiverConfigKeys>;

/**
 * Maps integration types to their corresponding Grafana icon names.
 * Based on common contact point integrations in Alertmanager.
 *
 * TypeScript will error if any integration from Receiver is missing!
 */
export const INTEGRATION_ICONS: Record<AllIntegrationTypes, IconName> = {
  email: 'envelope',
  slack: 'slack',
  pagerduty: 'pagerduty',
  webhook: 'link',
  opsgenie: 'cloud',
  wechat: 'comment-alt',
  pushover: 'mobile-android',
  victorops: 'bell',
  sns: 'amazon',
  telegram: 'telegram-alt',
  discord: 'discord',
  webex: 'camera',
  msteams: 'microsoft',
  msteamsv2: 'microsoft',
  jira: 'bug',
  rocketchat: 'comment-alt',
  incidentio: 'fire',
} as const;

/**
 * Type representing an integration type key (derived from Receiver schema)
 */
export type IntegrationType = AllIntegrationTypes;

/**
 * Mapping of integration types to their corresponding config property names in a Receiver object.
 */
const INTEGRATION_CONFIG_KEYS: Record<IntegrationType, keyof Receiver> = {
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
} as const;

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
        integrations.push({ type, config });
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
  return configs?.length ?? 0;
}

/**
 * Gets the icon name for a given integration type.
 * Returns a default icon if the type is not found.
 */
export function getIntegrationIcon(integrationType: string): IconName {
  const key = integrationType.toLowerCase() as IntegrationType;
  return INTEGRATION_ICONS[key] ?? 'channel-add';
}
