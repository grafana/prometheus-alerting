import type { PromRuleDTO, RulerRuleDTO } from '../vanilla/api';
import { hashQuery, hashLabelsOrAnnotations, simpleHash } from './hash';

/**
 * Generate a unique hash for a Prometheus rule
 * This is used to identify rules in lists and as React keys
 */
export function hashRule(rule: PromRuleDTO): string {
  const ruleName = rule.name;
  const queryHash = hashQuery(rule.query || '');
  const labelsHash = hashLabelsOrAnnotations(rule.labels);

  let fingerprint: string[];

  if (rule.type === 'recording') {
    fingerprint = [ruleName, 'recording', queryHash, labelsHash];
  } else if (rule.type === 'alerting') {
    const annotationsHash = hashLabelsOrAnnotations(rule.annotations);
    fingerprint = [ruleName, 'alerting', queryHash, annotationsHash, labelsHash];
  } else {
    // Unknown rule type
    fingerprint = [ruleName, 'unknown', queryHash, labelsHash];
  }

  return simpleHash(JSON.stringify(fingerprint)).toString();
}

/**
 * Generate a unique hash for a Ruler rule (from /api/v1/ruler/* endpoints)
 * This is used to identify rules from the Ruler API
 */
export function hashRulerRule(rule: RulerRuleDTO): string {
  // Ruler rules use 'expr' instead of 'query'
  const queryHash = hashQuery(rule.expr || '');
  const labelsHash = hashLabelsOrAnnotations(rule.labels);

  let fingerprint: string[];

  // Check if it's a recording rule (has 'record' field)
  if ('record' in rule && rule.record) {
    fingerprint = [rule.record, 'recording', queryHash, labelsHash];
  }
  // Otherwise it's an alerting rule (has 'alert' field)
  else if ('alert' in rule && rule.alert) {
    const annotationsHash = hashLabelsOrAnnotations(rule.annotations);
    fingerprint = [rule.alert, 'alerting', queryHash, annotationsHash, labelsHash];
  } else {
    // Fallback for unknown rule type
    const ruleName = ('alert' in rule && rule.alert) || ('record' in rule && rule.record) || 'unknown';
    fingerprint = [ruleName, 'unknown', queryHash, labelsHash];
  }

  return simpleHash(JSON.stringify(fingerprint)).toString();
}
