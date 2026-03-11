import { describe, it, expect } from 'vitest';
import { hashRule, hashRulerRule } from './rule';
import type { PromRuleDTO, RulerRuleDTO } from '../vanilla/api';

describe('hashRule', () => {
  it('returns a string', () => {
    const rule: PromRuleDTO = {
      name: 'HighCPU',
      type: 'alerting',
      health: 'ok',
      state: 'inactive',
      query: 'cpu_usage > 0.9',
      labels: { severity: 'warning' },
    };
    expect(typeof hashRule(rule)).toBe('string');
  });

  it('is deterministic — two separate objects with the same fields hash identically', () => {
    const rule1: PromRuleDTO = {
      name: 'HighCPU',
      type: 'alerting',
      health: 'ok',
      state: 'inactive',
      query: 'cpu_usage > 0.9',
      labels: { severity: 'warning' },
    };
    const rule2: PromRuleDTO = {
      name: 'HighCPU',
      type: 'alerting',
      health: 'ok',
      state: 'inactive',
      query: 'cpu_usage > 0.9',
      labels: { severity: 'warning' },
    };
    expect(hashRule(rule1)).toBe(hashRule(rule2));
  });

  it('returns different hashes for rules with different names', () => {
    const base: PromRuleDTO = {
      name: 'RuleA',
      type: 'alerting',
      health: 'ok',
      state: 'inactive',
      query: 'up == 0',
      labels: {},
    };
    const other: PromRuleDTO = { ...base, name: 'RuleB' };
    expect(hashRule(base)).not.toBe(hashRule(other));
  });

  it('hashes recording rules without annotations', () => {
    const rule: PromRuleDTO = {
      name: 'job:requests:rate5m',
      type: 'recording',
      health: 'ok',
      query: 'sum(rate(http_requests_total[5m]))',
      labels: {},
    };
    expect(typeof hashRule(rule)).toBe('string');
  });

  it('includes annotations in alerting rule hash', () => {
    const base: PromRuleDTO = {
      name: 'Alert',
      type: 'alerting',
      health: 'ok',
      state: 'inactive',
      query: 'up == 0',
      labels: {},
      annotations: { summary: 'Down' },
    };
    const noAnnotations: PromRuleDTO = { ...base, annotations: {} };
    expect(hashRule(base)).not.toBe(hashRule(noAnnotations));
  });
});

describe('hashRulerRule', () => {
  it('returns a string for alerting ruler rules', () => {
    const rule: RulerRuleDTO = {
      alert: 'HighCPU',
      expr: 'cpu_usage > 0.9',
      labels: { severity: 'warning' },
    };
    expect(typeof hashRulerRule(rule)).toBe('string');
  });

  it('is deterministic — two separate objects with the same fields hash identically', () => {
    const rule1: RulerRuleDTO = { alert: 'Test', expr: 'up == 0', labels: {} };
    const rule2: RulerRuleDTO = { alert: 'Test', expr: 'up == 0', labels: {} };
    expect(hashRulerRule(rule1)).toBe(hashRulerRule(rule2));
  });

  it('returns different hashes for rules with different expressions', () => {
    const rule1: RulerRuleDTO = { alert: 'Test', expr: 'up == 0', labels: {} };
    const rule2: RulerRuleDTO = { alert: 'Test', expr: 'up == 1', labels: {} };
    expect(hashRulerRule(rule1)).not.toBe(hashRulerRule(rule2));
  });

  it('returns a string for recording ruler rules', () => {
    const rule: RulerRuleDTO = {
      record: 'job:requests:rate5m',
      expr: 'sum(rate(http_requests_total[5m]))',
      labels: {},
    };
    expect(typeof hashRulerRule(rule)).toBe('string');
  });

  it('falls back gracefully for unknown ruler rule type', () => {
    const rule = { expr: 'up' } as RulerRuleDTO;
    // Should not throw, returns some string
    expect(typeof hashRulerRule(rule)).toBe('string');
  });
});
