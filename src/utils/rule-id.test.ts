import { fromRuleAndGroup, fromRulerRuleAndGroup } from './rule-id';
import type { PromRuleDTO, RulerRuleDTO } from '@grafana/external-rules/vanilla';
import type { DataSourceRuleGroupIdentifier } from '../types/rules';

const groupId: DataSourceRuleGroupIdentifier = {
  rulesSource: { uid: 'ds-uid', name: 'My DS', ruleSourceType: 'datasource' },
  namespace: { name: 'my-namespace' },
  groupName: 'my-group',
  groupOrigin: 'datasource',
};

describe('fromRuleAndGroup', () => {
  it('creates a Prometheus rule identifier', () => {
    const rule: PromRuleDTO = {
      name: 'HighCPU',
      type: 'alerting',
      health: 'ok',
      state: 'inactive',
      query: 'cpu > 0.9',
      labels: {},
    };

    const id = fromRuleAndGroup(rule, groupId);

    expect(id.type).toBe('prometheus');
    expect(id.uid).toBe('ds-uid');
    expect(id.namespace).toBe('my-namespace');
    expect(id.groupName).toBe('my-group');
    expect(id.ruleName).toBe('HighCPU');
    expect(typeof id.ruleHash).toBe('string');
  });

  it('produces consistent identifiers for the same rule', () => {
    const rule: PromRuleDTO = {
      name: 'Consistent',
      type: 'recording',
      health: 'ok',
      query: 'sum(rate(x[5m]))',
      labels: {},
    };

    const id1 = fromRuleAndGroup(rule, groupId);
    const id2 = fromRuleAndGroup(rule, groupId);
    expect(id1.ruleHash).toBe(id2.ruleHash);
  });
});

describe('fromRulerRuleAndGroup', () => {
  it('creates a Cloud rule identifier', () => {
    const rule: RulerRuleDTO = {
      alert: 'HighLatency',
      expr: 'latency > 1',
      labels: { severity: 'warning' },
    };

    const id = fromRulerRuleAndGroup(rule, groupId);

    expect(id.type).toBe('cloud');
    expect(id.uid).toBe('ds-uid');
    expect(id.namespace).toBe('my-namespace');
    expect(id.groupName).toBe('my-group');
    expect(id.ruleName).toBe('HighLatency');
    expect(typeof id.rulerRuleHash).toBe('string');
  });

  it('produces consistent identifiers for the same ruler rule', () => {
    const rule: RulerRuleDTO = { alert: 'Same', expr: 'up == 0', labels: {} };

    const id1 = fromRulerRuleAndGroup(rule, groupId);
    const id2 = fromRulerRuleAndGroup(rule, groupId);
    expect(id1.rulerRuleHash).toBe(id2.rulerRuleHash);
  });
});
