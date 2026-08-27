import { type Receiver } from '@grafana/external-alertmanager/vanilla';
import { getAllIntegrationTypes, getIntegrationCount } from './integrationIcons';
import { JsonValue } from 'type-fest';

export interface IntegrationCount {
  type: string;
  count: number;
}

/**
 * Gets all integration types and their counts for a receiver.
 * @param receiver - The Receiver object to analyze
 * @returns An array of integration types and counts
 */
export function getReceiverIntegrations(receiver: Receiver): IntegrationCount[] {
  const integrations: IntegrationCount[] = [];

  for (const type of getAllIntegrationTypes()) {
    const count = getIntegrationCount(receiver, type);
    if (count > 0) {
      integrations.push({ type, count });
    }
  }

  return integrations;
}

/**
 * Generates a human-readable description of a ContactPoint by summarizing its integrations.
 * If the ContactPoint has no integrations, it returns an empty placeholder text.
 *
 * For integrations, it counts the occurrences of each type and formats them as a comma-separated list.
 * Multiple integrations of the same type are indicated with a count in parentheses.
 *
 * @param receiver - The Receiver object to describe
 * @returns A string description of the Receiver's integrations
 */
export function getContactPointDescription(receiver: Receiver): string {
  const integrationCounts: Record<string, number> = {};

  for (const type of getAllIntegrationTypes()) {
    const count = getIntegrationCount(receiver, type);
    if (count > 0) {
      integrationCounts[type] = count;
    }
  }

  if (Object.keys(integrationCounts).length === 0) {
    return '<empty contact point>';
  }

  const description = Object.entries(integrationCounts)
    .map(([type, count]) => {
      // either "email" or "email (2)" but not "email (1)"
      return count > 1 ? `${type} (${count})` : type;
    })
    .join(', ');

  return description;
}

// Vanilla Alertmanager will respond with this value for sensitive fields
const SECRET_TOKEN = '<secret>';
// shared placeholder we show for any secret, regardless of which Alertmanager sent the config
const OUR_SECRET_TOKEN = '*************';

// Field names we treat as secret and hide by value, regardless of what the config actually contains.
// This matters most for Mimir, which does NOT mask secrets in its API responses (unlike vanilla Alertmanager).
const SECRET_KEYS = new Set([
  'api_key',
  'api_secret',
  'auth_password',
  'auth_secret',
  'bot_token',
  'client_secret',
  'credentials',
  'password',
  'routing_key',
  'secret_key',
  'service_key',
  'token',
  'user_key',
]);

const TYPE_SPECIFIC_SECRET_KEYS: Partial<Record<string, ReadonlySet<string>>> = {
  discord: new Set(['webhook_url']),
  msteams: new Set(['webhook_url']),
  msteamsv2: new Set(['webhook_url']),
  slack: new Set(['api_url']),
};

// Masks values for known secret fields, by name — matters most for Mimir, which doesn't redact secrets server-side.
// Runs on configs from either backend; for vanilla Alertmanager it's a harmless no-op on top of transformEntry below.
export function maskSensitiveConfig(type: string, config: Record<string, JsonValue>): Record<string, JsonValue> {
  return Object.fromEntries(Object.entries(config).map(([key, value]) => [key, maskSensitiveValue(type, value, key)]));
}

function maskSensitiveValue(type: string, value: JsonValue, key?: string): JsonValue {
  if (key && (SECRET_KEYS.has(key) || TYPE_SPECIFIC_SECRET_KEYS[type]?.has(key))) {
    return OUR_SECRET_TOKEN;
  }
  if (Array.isArray(value)) {
    return value.map((item) => maskSensitiveValue(type, item));
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, child]) => [childKey, maskSensitiveValue(type, child, childKey)])
    );
  }
  return value;
}

/**
 * Vanilla Alertmanager-only: this function will transform a receiver's key-value pair recursively.
 * Vanilla Alertmanager already masks secrets itself (as SECRET_TOKEN), so we just swap that for our own placeholder.
 */
export function transformEntry([key, value]: [string, JsonValue]): { label: string; value: JsonValue } {
  const transformedValue = transformValue(value);
  return { label: key, value: transformedValue };
}

/**
 * Recursively transforms values, replacing SECRET_TOKEN with masked string in nested structures.
 */
function transformValue(value: JsonValue): JsonValue {
  // Replace secret token with masked string
  if (value === SECRET_TOKEN) {
    return OUR_SECRET_TOKEN;
  }

  // Recursively handle arrays
  if (Array.isArray(value)) {
    return value.map(transformValue);
  }

  // Recursively handle objects
  if (value !== null && typeof value === 'object') {
    const result: Record<string, JsonValue> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = transformValue(v);
    }
    return result;
  }

  // Return primitives as-is
  return value;
}

/**
 * Checks if a config entry should be displayed in the UI.
 * Filters out internal fields (starting with '_'), empty/null values, and optionally specific keys.
 */
export function shouldDisplayConfigEntry(
  key: string,
  value: JsonValue,
  options?: {
    excludeKeys?: string[];
    excludeEmptyObjects?: boolean;
  }
): boolean {
  const { excludeKeys = [], excludeEmptyObjects = false } = options ?? {};

  // Skip internal fields (starting with underscore)
  if (key.startsWith('_')) {
    return false;
  }

  // Skip undefined or null values
  if (value === undefined || value === null) {
    return false;
  }

  // Skip excluded keys
  if (excludeKeys.includes(key)) {
    return false;
  }

  // Skip empty objects if requested
  if (excludeEmptyObjects && typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
    return false;
  }

  return true;
}

/**
 * Filters and transforms config entries for display.
 * Removes internal fields, empty values, and optionally specific keys.
 * Transforms sensitive values (secrets) to masked strings.
 */
export function filterAndTransformConfigEntries(
  config: Record<string, JsonValue>,
  options?: {
    excludeKeys?: string[];
    excludeEmptyObjects?: boolean;
  }
): Array<{ label: string; value: JsonValue }> {
  return Object.entries(config)
    .filter(([key, value]) => shouldDisplayConfigEntry(key, value, options))
    .map(transformEntry);
}
