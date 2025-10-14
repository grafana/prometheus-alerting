import { PromRuleDTO } from '@grafana/external-rules/vanilla';

/**
 * Type guard to check if a rule is an alerting rule
 */
export function isAlertingRule(rule: PromRuleDTO): rule is PromRuleDTO & { type: 'alerting' } {
  return rule.type === 'alerting';
}

/**
 * Type guard to check if a rule is a recording rule
 */
export function isRecordingRule(rule: PromRuleDTO): rule is PromRuleDTO & { type: 'recording' } {
  return rule.type === 'recording';
}

/**
 * Get the name of a rule
 */
export function getRuleName(rule: PromRuleDTO): string {
  return rule.name;
}
