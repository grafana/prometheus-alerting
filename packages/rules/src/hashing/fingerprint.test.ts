import { describe, it, expect } from 'vitest';
import { getPromRuleFingerprint, getRulerRuleFingerprint } from './fingerprint';
import type { PromRuleDTO, RulerRuleDTO } from '../vanilla/api';

const baseRecordingRule: PromRuleDTO = {
  name: 'job:requests:rate5m',
  type: 'recording',
  health: 'ok',
  query: 'sum(rate(http_requests_total[5m]))',
  labels: {},
};

const baseAlertingRule: PromRuleDTO = {
  name: 'HighLatency',
  type: 'alerting',
  health: 'ok',
  state: 'inactive',
  query: 'histogram_quantile(0.99, rate(http_duration_seconds_bucket[5m])) > 1',
  labels: { severity: 'warning' },
  annotations: { summary: 'High latency' },
};

describe('getPromRuleFingerprint', () => {
  it('fingerprints a recording rule', () => {
    const result = getPromRuleFingerprint(baseRecordingRule, true);
    expect(result[0]).toBe('job:requests:rate5m');
    expect(result[1]).toBe('recording');
    expect(result).toHaveLength(4);
  });

  it('fingerprints an alerting rule with 5 elements', () => {
    const result = getPromRuleFingerprint(baseAlertingRule, true);
    expect(result[0]).toBe('HighLatency');
    expect(result[1]).toBe('alerting');
    expect(result).toHaveLength(5); // name, type, queryHash, annotationsHash, labelsHash
  });

  it('omits query hash when includeQuery is false', () => {
    const withQuery = getPromRuleFingerprint(baseAlertingRule, true);
    const withoutQuery = getPromRuleFingerprint(baseAlertingRule, false);
    expect(withQuery[2]).not.toBe('');
    expect(withoutQuery[2]).toBe('');
  });

  it('produces different fingerprints for different queries when includeQuery is true', () => {
    const rule1: PromRuleDTO = { ...baseRecordingRule, query: 'query_a' };
    const rule2: PromRuleDTO = { ...baseRecordingRule, query: 'query_b' };
    expect(getPromRuleFingerprint(rule1, true)).not.toEqual(getPromRuleFingerprint(rule2, true));
  });

  it('throws for unknown rule type', () => {
    const rule = { ...baseAlertingRule, type: 'unknown' as 'alerting' };
    expect(() => getPromRuleFingerprint(rule, false)).toThrow('Only recording and alerting rules can be fingerprinted');
  });
});

describe('getRulerRuleFingerprint', () => {
  it('fingerprints a recording ruler rule', () => {
    const rule: RulerRuleDTO = {
      record: 'job:requests:rate5m',
      expr: 'sum(rate(http_requests_total[5m]))',
      labels: {},
    };

    const result = getRulerRuleFingerprint(rule, true);
    expect(result[0]).toBe('job:requests:rate5m');
    expect(result[1]).toBe('recording');
    expect(result).toHaveLength(4);
  });

  it('fingerprints an alerting ruler rule with 5 elements', () => {
    const rule: RulerRuleDTO = {
      alert: 'HighLatency',
      expr: 'up == 0',
      labels: { severity: 'critical' },
      annotations: { summary: 'Down' },
    };

    const result = getRulerRuleFingerprint(rule, true);
    expect(result[0]).toBe('HighLatency');
    expect(result[1]).toBe('alerting');
    expect(result).toHaveLength(5);
  });

  it('omits query hash when includeQuery is false', () => {
    const rule: RulerRuleDTO = { alert: 'Test', expr: 'up == 0', labels: {} };
    const withQuery = getRulerRuleFingerprint(rule, true);
    const withoutQuery = getRulerRuleFingerprint(rule, false);
    expect(withQuery[2]).not.toBe('');
    expect(withoutQuery[2]).toBe('');
  });

  it('throws for a rule with neither alert nor record', () => {
    const rule = { expr: 'up' } as RulerRuleDTO;
    expect(() => getRulerRuleFingerprint(rule, false)).toThrow(
      'Only recording and alerting ruler rules can be fingerprinted'
    );
  });
});
