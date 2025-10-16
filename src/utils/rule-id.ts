import { PromRuleDTO } from '@grafana/external-rules/vanilla';

import { DataSourceRuleGroupIdentifier } from '../types/rules';
import { getRuleName, isAlertingRule, isRecordingRule } from './rules';

/**
 * Minimal Ruler rule type for hashing purposes
 * Ruler rules from /api/v1/ruler/* endpoints have a different structure than Prometheus rules
 */
export interface RulerRuleDTO {
  alert?: string; // For alerting rules
  record?: string; // For recording rules
  expr: string; // Query expression (note: different field name from PromRuleDTO.query)
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  for?: string; // Duration for alerting rules
}

/**
 * Prometheus Rule Identifier - for rules read from /api/v1/rules endpoint
 */
export interface PrometheusRuleIdentifier {
  type: 'prometheus';
  uid: string; // data source UID
  namespace: string;
  groupName: string;
  ruleName: string;
  ruleHash: string; // hash of the Prometheus rule representation
}

/**
 * Cloud/Ruler Rule Identifier - for rules read from /api/v1/ruler/* endpoints
 */
export interface CloudRuleIdentifier {
  type: 'cloud';
  uid: string; // data source UID
  namespace: string;
  groupName: string;
  ruleName: string;
  rulerRuleHash: string; // hash of the Ruler rule representation
}

/**
 * Union type for all supported rule identifiers
 */
export type DataSourceRuleIdentifier = PrometheusRuleIdentifier | CloudRuleIdentifier;

// Prefixes for rule identifiers
const PROMETHEUS_RULE_IDENTIFIER_PREFIX = 'pri';
const CLOUD_RULE_IDENTIFIER_PREFIX = 'cri';

/**
 * Type guard for Prometheus rule identifiers
 */
export function isPrometheusRuleIdentifier(
  identifier: DataSourceRuleIdentifier
): identifier is PrometheusRuleIdentifier {
  return identifier.type === 'prometheus';
}

/**
 * Type guard for Cloud/Ruler rule identifiers
 */
export function isCloudRuleIdentifier(identifier: DataSourceRuleIdentifier): identifier is CloudRuleIdentifier {
  return identifier.type === 'cloud';
}

/**
 * Escape dollar signs to avoid conflicts with the separator
 */
function escapeDollars(value: string): string {
  return value.replace(/\$/g, '_DOLLAR_');
}

/**
 * Unescape dollar signs
 */
function unescapeDollars(value: string): string {
  return value.replace(/\_DOLLAR\_/g, '$');
}

/**
 * Escape path separators (/ and \) to avoid conflicts
 */
export function escapePathSeparators(value: string): string {
  return value.replace(/\//g, '\x1f').replace(/\\/g, '\x1e');
}

/**
 * Unescape path separators
 */
export function unescapePathSeparators(value: string): string {
  return value.replace(/\x1f/g, '/').replace(/\x1e/g, '\\');
}

/**
 * Create a Prometheus rule identifier from a Prometheus rule and group identifier
 * The ruleHash ensures uniqueness even when multiple rules have the same name
 */
export function fromRuleAndGroup(
  rule: PromRuleDTO,
  groupIdentifier: DataSourceRuleGroupIdentifier
): PrometheusRuleIdentifier {
  const ruleName = getRuleName(rule);
  const ruleHash = hashRule(rule);

  return {
    type: 'prometheus',
    uid: groupIdentifier.rulesSource.uid,
    namespace: groupIdentifier.namespace.name,
    groupName: groupIdentifier.groupName,
    ruleName,
    ruleHash,
  };
}

/**
 * Create a Cloud/Ruler rule identifier from a Ruler rule and group identifier
 * The rulerRuleHash ensures uniqueness even when multiple rules have the same name
 */
export function fromRulerRuleAndGroup(
  rule: RulerRuleDTO,
  groupIdentifier: DataSourceRuleGroupIdentifier
): CloudRuleIdentifier {
  // Ruler rules use 'alert' or 'record' fields instead of 'name'
  const ruleName = rule.alert || rule.record || 'unknown';
  const rulerRuleHash = hashRulerRule(rule);

  return {
    type: 'cloud',
    uid: groupIdentifier.rulesSource.uid,
    namespace: groupIdentifier.namespace.name,
    groupName: groupIdentifier.groupName,
    ruleName,
    rulerRuleHash,
  };
}

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

/**
 * Simple hash function for strings
 */
function simpleHash(value: string): number {
  let hash = 0;
  if (value.length === 0) {
    return hash;
  }
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Hash labels or annotations for fingerprinting
 */
function hashLabelsOrAnnotations(item: Record<string, string> | undefined): string {
  return JSON.stringify(Object.entries(item || {}).sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * Hash a query string for fingerprinting
 */
function hashQuery(query: string): string {
  // remove comments
  query = query
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .join('\n');

  // one of them might be wrapped in parens
  if (query.length > 1 && query[0] === '(' && query[query.length - 1] === ')') {
    query = query.slice(1, -1);
  }

  return query.trim();
}

/**
 * Generate a unique hash for a Prometheus rule
 * This is used to identify rules in lists and as React keys
 */
export function hashRule(rule: PromRuleDTO): string {
  const ruleName = getRuleName(rule);
  const queryHash = hashQuery(rule.query || '');
  const labelsHash = hashLabelsOrAnnotations(rule.labels);

  let fingerprint: unknown[];

  if (isRecordingRule(rule)) {
    fingerprint = [ruleName, 'recording', queryHash, labelsHash];
  } else if (isAlertingRule(rule)) {
    const annotationsHash = hashLabelsOrAnnotations(rule.annotations);
    fingerprint = [ruleName, 'alerting', queryHash, annotationsHash, labelsHash];
  } else {
    // Unknown rule type
    fingerprint = [ruleName, 'unknown', queryHash, labelsHash];
  }

  return simpleHash(JSON.stringify(fingerprint)).toString();
}

/**
 * Generate a unique hash for a Ruler rule (from /api/v1/ruler/* endpoints)
 * This is used to identify rules from the Ruler API
 */
export function hashRulerRule(rule: RulerRuleDTO): string {
  // Ruler rules use 'expr' instead of 'query'
  const queryHash = hashQuery(rule.expr || '');
  const labelsHash = hashLabelsOrAnnotations(rule.labels);

  let fingerprint: unknown[];

  // Check if it's a recording rule (has 'record' field)
  if ('record' in rule && rule.record) {
    fingerprint = [rule.record, 'recording', queryHash, labelsHash];
  }
  // Otherwise it's an alerting rule (has 'alert' field)
  else if ('alert' in rule && rule.alert) {
    const annotationsHash = hashLabelsOrAnnotations(rule.annotations);
    fingerprint = [rule.alert, 'alerting', queryHash, annotationsHash, labelsHash];
  } else {
    // Fallback for unknown rule type
    const ruleName = ('alert' in rule && rule.alert) || ('record' in rule && rule.record) || 'unknown';
    fingerprint = [ruleName, 'unknown', queryHash, labelsHash];
  }

  return simpleHash(JSON.stringify(fingerprint)).toString();
}
