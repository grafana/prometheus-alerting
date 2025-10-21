import type { DataSourceRuleIdentifier, PrometheusRuleIdentifier, CloudRuleIdentifier } from './identifier';

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
