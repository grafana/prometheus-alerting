import type { PromRuleDTO, RulerRuleDTO } from '../vanilla/api';
import { hashQuery, hashLabelsOrAnnotations } from './hash';

/**
 * Generate a fingerprint for a Prometheus rule for matching purposes.
 * Returns an array of values that uniquely identify a rule.
 *
 * @param rule - The Prometheus rule
 * @param includeQuery - Whether to include the query in the fingerprint
 * @returns An array representing the rule's fingerprint
 */
export function getPromRuleFingerprint(rule: PromRuleDTO, includeQuery: boolean): unknown[] {
  const queryHash = includeQuery ? hashQuery(rule.query || '') : '';
  const labelsHash = hashLabelsOrAnnotations(rule.labels);

  if (rule.type === 'recording') {
    return [rule.name, 'recording', queryHash, labelsHash];
  }
  if (rule.type === 'alerting') {
    return [rule.name, 'alerting', queryHash, hashLabelsOrAnnotations(rule.annotations), labelsHash];
  }
  throw new Error('Only recording and alerting rules can be fingerprinted');
}

/**
 * Generate a fingerprint for a Ruler rule for matching purposes.
 * Returns an array of values that uniquely identify a rule.
 *
 * @param rule - The Ruler rule
 * @param includeQuery - Whether to include the query in the fingerprint
 * @returns An array representing the rule's fingerprint
 */
export function getRulerRuleFingerprint(rule: RulerRuleDTO, includeQuery: boolean): unknown[] {
  const queryHash = includeQuery ? hashQuery(rule.expr || '') : '';
  const labelsHash = hashLabelsOrAnnotations(rule.labels);

  if ('record' in rule && rule.record) {
    return [rule.record, 'recording', queryHash, labelsHash];
  }
  if ('alert' in rule && rule.alert) {
    return [rule.alert, 'alerting', queryHash, hashLabelsOrAnnotations(rule.annotations), labelsHash];
  }
  throw new Error('Only recording and alerting ruler rules can be fingerprinted');
}
