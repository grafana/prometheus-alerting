import { escapeDollars, unescapeDollars, escapePathSeparators, unescapePathSeparators } from './escape';
import {
  PROMETHEUS_RULE_IDENTIFIER_PREFIX,
  CLOUD_RULE_IDENTIFIER_PREFIX,
  type DataSourceRuleIdentifier,
} from './identifier';
import { isPrometheusRuleIdentifier } from './guards';

/**
 * Convert a rule identifier to a string for use in URLs
 * Format:
 * - Prometheus: pri$datasourceUid$namespace$groupName$ruleName$ruleHash
 * - Cloud/Ruler: cri$datasourceUid$namespace$groupName$ruleName$rulerRuleHash
 * Uses $ as separator with proper escaping for special characters
 */
export function stringifyIdentifier(identifier: DataSourceRuleIdentifier): string {
  if (isPrometheusRuleIdentifier(identifier)) {
    return [
      PROMETHEUS_RULE_IDENTIFIER_PREFIX,
      identifier.uid,
      identifier.namespace,
      identifier.groupName,
      identifier.ruleName,
      identifier.ruleHash,
    ]
      .map(String)
      .map(escapeDollars)
      .map(escapePathSeparators)
      .join('$');
  }

  // Cloud/Ruler identifier
  return [
    CLOUD_RULE_IDENTIFIER_PREFIX,
    identifier.uid,
    identifier.namespace,
    identifier.groupName,
    identifier.ruleName,
    identifier.rulerRuleHash,
  ]
    .map(String)
    .map(escapeDollars)
    .map(escapePathSeparators)
    .join('$');
}

/**
 * Parse a stringified rule identifier back into an object
 * @param value - The stringified identifier (e.g., "pri$uid$namespace$group$rule$hash" or "cri$...")
 * @param decodeFromUri - Whether to decode URI components first
 */
export function parseIdentifier(value: string, decodeFromUri = false): DataSourceRuleIdentifier | null {
  const source = decodeFromUri ? decodeURIComponent(value) : value;
  const parts = source.split('$');

  // Expected format: prefix$uid$namespace$groupName$ruleName$hash
  if (parts.length !== 6) {
    return null;
  }

  const [prefix, uid, namespace, groupName, ruleName, hash] = parts.map(unescapeDollars).map(unescapePathSeparators);

  if (prefix === PROMETHEUS_RULE_IDENTIFIER_PREFIX) {
    return {
      type: 'prometheus',
      uid,
      namespace,
      groupName,
      ruleName,
      ruleHash: hash,
    };
  }

  if (prefix === CLOUD_RULE_IDENTIFIER_PREFIX) {
    return {
      type: 'cloud',
      uid,
      namespace,
      groupName,
      ruleName,
      rulerRuleHash: hash,
    };
  }

  // Unknown prefix
  return null;
}
