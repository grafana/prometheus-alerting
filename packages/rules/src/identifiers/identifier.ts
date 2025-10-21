/**
 * Universal rule identifier types
 * These work with any Prometheus-compatible implementation (vanilla, Mimir, Cortex, Loki)
 */

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
export const PROMETHEUS_RULE_IDENTIFIER_PREFIX = 'pri' as const;
export const CLOUD_RULE_IDENTIFIER_PREFIX = 'cri' as const;
