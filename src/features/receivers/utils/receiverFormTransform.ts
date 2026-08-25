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
          settings: normalizeLegacyBearerToken(settings),
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
        const normalizedValue = key === 'http_config' && isRecord(value) ? normalizeLegacyBearerToken(value) : value;
        // Handle nested objects (like http_config)
        if (isRecord(normalizedValue)) {
          const cleanedNested = cleanEmptyValues(normalizedValue);
          if (Object.keys(cleanedNested).length > 0) {
            config[key] = cleanedNested;
          }
        } else {
          config[key] = normalizedValue;
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

    if (key === 'authorization' && isRecord(value)) {
      const cleanedAuthorization = cleanEmptyValues(value);
      if (hasAuthorizationCredentials(cleanedAuthorization)) {
        cleaned[key] = cleanedAuthorization;
      }
      continue;
    }

    if (isRecord(value)) {
      const cleanedNested = cleanEmptyValues(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function normalizeLegacyBearerToken(settings: Record<string, unknown>): Record<string, unknown> {
  const httpConfig = settings.http_config;
  if (!isRecord(httpConfig)) {
    return { ...settings };
  }

  const { bearer_token, bearer_token_file, authorization, ...otherHttpConfig } = httpConfig;
  const normalizedAuthorization =
    authorization ?? createAuthorizationFromLegacyBearerToken(bearer_token, bearer_token_file);
  const normalizedHttpConfig = { ...otherHttpConfig };

  if (normalizedAuthorization !== undefined) {
    normalizedHttpConfig.authorization = normalizedAuthorization;
  }

  return {
    ...settings,
    http_config: normalizedHttpConfig,
  };
}

function createAuthorizationFromLegacyBearerToken(
  bearerToken: unknown,
  bearerTokenFile: unknown
): Record<string, string> | undefined {
  if (hasValue(bearerToken)) {
    return { type: 'Bearer', credentials: bearerToken };
  }
  if (hasValue(bearerTokenFile)) {
    return { type: 'Bearer', credentials_file: bearerTokenFile };
  }
  return undefined;
}

function hasAuthorizationCredentials(authorization: Record<string, unknown>): boolean {
  return hasValue(authorization.credentials) || hasValue(authorization.credentials_file);
}

function hasValue(value: unknown): value is string {
  return typeof value === 'string' && value !== '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

  return {
    __id: generateId(),
    type,
    sendResolved: true,
    settings: notifier ? createDefaultSettings(notifier.options) : {},
  };
}

function createDefaultSettings(options: NotifierDTO['options']): Record<string, unknown> {
  const settings: Record<string, unknown> = {};

  for (const option of options) {
    if (option.element === 'subform' && option.subformOptions) {
      const nestedSettings = createDefaultSettings(option.subformOptions);
      if (Object.keys(nestedSettings).length > 0) {
        settings[option.propertyName] = nestedSettings;
      }
      continue;
    }

    if (option.defaultValue !== undefined) {
      settings[option.propertyName] = option.defaultValue;
    }
  }

  return settings;
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
  return !existingReceivers.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.name !== originalName);
}
