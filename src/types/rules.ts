import { PromRuleGroupDTO, PromRuleDTO } from '@grafana/external-rules/vanilla';
import type { RulePositionHash } from '@grafana/external-rules/matching';

export type { PromRuleGroupDTO, PromRuleDTO };

// Import StateIcon types from the internal path since they're not exported from unstable
export type Health = 'nodata' | 'error';
export type State = 'normal' | 'firing' | 'pending' | 'unknown' | 'recovering';

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
