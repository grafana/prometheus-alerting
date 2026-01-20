/**
 * Utilities for transforming between Alertmanager receiver format and form values.
 */
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { cloudNotifierTypes, NotifierDTO } from './notifierTypes';

/**
 * Integration type keys that map to receiver config arrays
 */
export const INTEGRATION_TYPE_MAP: Record<string, keyof Receiver> = {
  email: 'email_configs',
  webhook: 'webhook_configs',
  slack: 'slack_configs',
  pagerduty: 'pagerduty_configs',
  opsgenie: 'opsgenie_configs',
  discord: 'discord_configs',
  msteams: 'msteams_configs',
  telegram: 'telegram_configs',
  pushover: 'pushover_configs',
  victorops: 'victorops_configs',
  sns: 'sns_configs',
  webex: 'webex_configs',
  wechat: 'wechat_configs',
};

/**
 * Form values for a single integration
 */
export interface IntegrationFormValues {
  __id: string;
  __deleted?: boolean;
  type: string;
  sendResolved: boolean;
  settings: Record<string, unknown>;
}

/**
 * Form values for the entire receiver
 */
export interface ReceiverFormValues {
  name: string;
  integrations: IntegrationFormValues[];
}

/**
 * Generate a unique ID for form items
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Get the config key for a given integration type
 */
export function getConfigKeyForType(type: string): keyof Receiver | undefined {
  return INTEGRATION_TYPE_MAP[type];
}

/**
 * Extract integrations from a receiver into form values
 */
export function receiverToFormValues(receiver: Receiver): ReceiverFormValues {
  const integrations: IntegrationFormValues[] = [];

  // Iterate through all possible integration types
  for (const [type, configKey] of Object.entries(INTEGRATION_TYPE_MAP)) {
    const configs = receiver[configKey] as Array<Record<string, unknown>> | undefined;
    if (configs && Array.isArray(configs)) {
      for (const config of configs) {
        // Extract send_resolved and remove it from settings
        const { send_resolved, ...settings } = config;
        integrations.push({
          __id: generateId(),
          type,
          sendResolved: send_resolved !== false, // default to true
          settings,
        });
      }
    }
  }

  return {
    name: receiver.name,
    integrations,
  };
}

/**
 * Convert form values back to a receiver object
 */
export function formValuesToReceiver(values: ReceiverFormValues): Receiver {
  const receiver: Receiver = {
    name: values.name,
  };

  // Group integrations by type
  for (const integration of values.integrations) {
    // Skip deleted integrations
    if (integration.__deleted) {
      continue;
    }

    const configKey = getConfigKeyForType(integration.type);
    if (!configKey) {
      console.warn(`Unknown integration type: ${integration.type}`);
      continue;
    }

    // Initialize the config array if needed
    if (!receiver[configKey]) {
      // Type assertion needed due to dynamic key
      (receiver as Record<string, unknown>)[configKey] = [];
    }

    // Build the config object, cleaning up empty values
    const config: Record<string, unknown> = {
      send_resolved: integration.sendResolved,
    };

    // Add settings, filtering out empty values
    for (const [key, value] of Object.entries(integration.settings)) {
      if (value !== '' && value !== null && value !== undefined) {
        // Handle nested objects (like http_config)
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedNested = cleanEmptyValues(value as Record<string, unknown>);
          if (Object.keys(cleanedNested).length > 0) {
            config[key] = cleanedNested;
          }
        } else {
          config[key] = value;
        }
      }
    }

    // Add to the config array
    (receiver[configKey] as Array<Record<string, unknown>>).push(config);
  }

  return receiver;
}

/**
 * Remove empty values from an object recursively
 */
function cleanEmptyValues(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanEmptyValues(value as Record<string, unknown>);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

/**
 * Create default form values for a new receiver
 */
export function createDefaultReceiverFormValues(): ReceiverFormValues {
  return {
    name: '',
    integrations: [createDefaultIntegration('webhook')],
  };
}

/**
 * Create a new integration with default values for a given type
 */
export function createDefaultIntegration(type: string): IntegrationFormValues {
  const notifier = cloudNotifierTypes.find((n) => n.type === type);
  const settings: Record<string, unknown> = {};

  // Set default values from notifier options
  if (notifier) {
    for (const option of notifier.options) {
      if (option.defaultValue !== undefined) {
        const defaultVal = option.defaultValue;
        // Handle select default values which are objects
        if (typeof defaultVal === 'object' && defaultVal !== null && 'value' in defaultVal) {
          settings[option.propertyName] = (defaultVal as { value: unknown }).value;
        } else {
          settings[option.propertyName] = defaultVal;
        }
      }
    }
  }

  return {
    __id: generateId(),
    type,
    sendResolved: true,
    settings,
  };
}

/**
 * Get the notifier definition for a type
 */
export function getNotifierForType(type: string): NotifierDTO | undefined {
  return cloudNotifierTypes.find((n) => n.type === type);
}

/**
 * Validate that a receiver name is not a duplicate
 */
export function isReceiverNameUnique(name: string, existingReceivers: Receiver[], originalName?: string): boolean {
  return !existingReceivers.some(
    (r) => r.name.toLowerCase() === name.toLowerCase() && r.name !== originalName
  );
}
