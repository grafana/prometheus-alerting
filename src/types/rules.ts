import { PromRuleGroupDTO, PromRuleDTO } from '@grafana/external-rules/vanilla';
import type { RulePositionHash } from '@grafana/external-rules/matching';

export type { PromRuleGroupDTO, PromRuleDTO };

// Import StateIcon types from the internal path since they're not exported from unstable
export type Health = 'nodata' | 'error';
export type State = 'normal' | 'firing' | 'pending' | 'unknown' | 'recovering';

export type RulesSourceApplication = 'prometheus' | 'mimir' | 'cortex' | 'loki';

export interface PromBuildInfoResponse {
  status: string;
  data: {
    application?: string;
    version: string;
    revision?: string;
    branch?: string;
    buildUser?: string;
    buildDate?: string;
    goVersion?: string;
    features?: {
      ruler_config_api?: string;
      alertmanager_config_api?: string;
      query_sharding?: string;
      federated_rules?: string;
    };
  };
}

export interface DataSourceFeatures {
  application: RulesSourceApplication;
  rulerApiEnabled: boolean;
}

/**
 * Returns the API path for reading runtime rule state.
 *
 * Loki exposes its Prometheus-compatible runtime rules endpoint at a different
 * path from Prometheus, Mimir, and Cortex. Loki's Ruler CRUD API uses the
 * separate /api/prom/rules path and returns YAML.
 */
export function getPrometheusRulesApiBasePath(pluginType: 'prometheus' | 'loki'): string {
  return pluginType === 'loki' ? 'prometheus/api/v1/rules' : 'api/v1/rules';
}

/**
 * Returns the ruler API base path for the given application type.
 * Used to build URLs like /api/datasources/proxy/uid/{uid}/{rulerApiPath}/{namespace}/{group}
 */
export function getRulerApiBasePath(application: RulesSourceApplication): string {
  switch (application) {
    case 'loki':
      return 'api/prom/rules';
    case 'mimir':
    case 'cortex':
    case 'prometheus':
    default:
      return 'config/v1/rules';
  }
}

/**
 * Returns the instant query API path for the given application type.
 * Used to build URLs like /api/datasources/proxy/uid/{uid}/{queryApiPath}
 */
export function getQueryApiPath(application: RulesSourceApplication): string {
  switch (application) {
    case 'loki':
      return 'loki/api/v1/query';
    case 'mimir':
    case 'cortex':
    case 'prometheus':
    default:
      return 'api/v1/query';
  }
}

export interface DataSourceRulesSourceIdentifier {
  uid: string;
  name: string;
  ruleSourceType: 'datasource';
}

export interface DataSourceNamespaceIdentifier {
  name: string;
}

export interface DataSourceRuleGroupIdentifier {
  rulesSource: DataSourceRulesSourceIdentifier;
  namespace: DataSourceNamespaceIdentifier;
  groupName: string;
  groupOrigin: 'datasource';
}

// Re-export PromRuleGroupDTO as RuleGroup for convenience
export type RuleGroup = PromRuleGroupDTO;

export type Rule = PromRuleDTO;

// Type for rules with origin information (used in FilterView)
export interface PromRuleWithOrigin {
  rule: PromRuleDTO;
  groupIdentifier: DataSourceRuleGroupIdentifier;
  origin: 'datasource';
  /**
   * The rule's position within its own group, e.g. `"0:3"` for the first rule of a 3-rule group.
   * Used to disambiguate fully-identical duplicate rules when matching against the Ruler API --
   * see `getMatchingRulerRule` in `@grafana/external-rules/matching`.
   */
  rulePositionHash: RulePositionHash;
}

// Normalize Prometheus state strings to StateIcon state types
export function normalizeState(state?: string): State {
  if (!state) {
    return 'unknown';
  }

  const lowerState = state.toLowerCase();

  switch (lowerState) {
    case 'inactive':
      return 'normal'; // Prometheus 'inactive' maps to 'normal' in StateIcon
    case 'pending':
      return 'pending';
    case 'firing':
      return 'firing';
    case 'normal':
      return 'normal';
    case 'recovering':
      return 'recovering';
    default:
      return 'unknown';
  }
}

// Normalize health values
export function normalizeHealth(health?: string): Health | undefined {
  if (!health || health === 'ok') {
    return undefined;
  }

  const lowerHealth = health.toLowerCase();

  switch (lowerHealth) {
    case 'error':
    case 'err':
      return 'error';
    case 'nodata':
    case 'no_data':
      return 'nodata';
    default:
      return undefined;
  }
}
