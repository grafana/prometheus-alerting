import type { PromRuleDTO, RulerRuleDTO } from '../vanilla/api';

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
 * Get the name of a rule (works with both PromRuleDTO and RulerRuleDTO)
 */
export function getRuleName(rule: PromRuleDTO): string;
// eslint-disable-next-line no-redeclare
export function getRuleName(rule: RulerRuleDTO): string;
// eslint-disable-next-line no-redeclare
export function getRuleName(rule: PromRuleDTO | RulerRuleDTO): string {
  // For PromRuleDTO
  if ('name' in rule) {
    return rule.name;
  }

  // For RulerRuleDTO - check if it's an alerting or recording rule
  if ('alert' in rule) {
    return rule.alert;
  }

  if ('record' in rule) {
    return rule.record;
  }

  return '';
}
