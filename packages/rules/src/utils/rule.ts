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

/**
 * A recording rule's name becomes the name of the metric it writes. Mimir (and Prometheus, and
 * Loki) only accept metric names made of letters, digits, underscores and colons, and they can't
 * start with a digit -- as long as the tenant is on Mimir's default name-validation setting.
 * Mimir also has an experimental per-tenant setting that only requires valid UTF-8, which would
 * make this check too strict, but there's no API a normal tenant can call to tell which mode is
 * active, and the experimental setting is off by default, so we check against the default.
 */
const METRIC_NAME_PATTERN = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;

export function isValidMetricName(name: string): boolean {
  return METRIC_NAME_PATTERN.test(name);
}
