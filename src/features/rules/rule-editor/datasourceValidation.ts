import { isSupportedRulesSourceType } from '../../../api/rules/flavors/registry';

/**
 * Check if a data source type supports external rules (Prometheus-compatible).
 *
 * `type` is a Grafana data source **plugin type**, so only the types in the flavor registry can
 * ever match -- Mimir and Cortex register as `prometheus` and are told apart at runtime by
 * feature discovery, not here.
 */
export function isSupportedExternalRulesSourceType(type: string): boolean {
  return isSupportedRulesSourceType(type.toLowerCase());
}
