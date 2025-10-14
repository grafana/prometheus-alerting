import { PromRuleDTO } from '@grafana/external-rules/vanilla';

/**
 * Create a stable hash/ID for a rule for use as React key
 */
export function hashRule(rule: PromRuleDTO): string {
  return `${rule.name}-${rule.type}-${rule.query}`;
}
