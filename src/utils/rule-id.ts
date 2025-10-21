import { PromRuleDTO, RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { hashRule, hashRulerRule } from '@grafana/external-rules/hashing';
import { getRuleName } from '@grafana/external-rules/utils';
import type { PrometheusRuleIdentifier, CloudRuleIdentifier } from '@grafana/external-rules/identifiers';

import { DataSourceRuleGroupIdentifier } from '../types/rules';

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
  const ruleName = getRuleName(rule);
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
