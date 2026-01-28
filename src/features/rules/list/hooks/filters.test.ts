import { PromRuleGroupDTO, PromAlertingRuleDTO, PromRecordingRuleDTO } from '@grafana/external-rules/vanilla';

import { groupFilter, ruleFilter } from './filters';

describe('filters', () => {
  describe('groupFilter', () => {
    const createGroup = (name: string, file: string): PromRuleGroupDTO => ({
      name,
      file,
      interval: 60,
      rules: [],
    });

    it('should return true when no filters are applied', () => {
      const group = createGroup('test-group', 'test-namespace');
      expect(groupFilter(group, {})).toBe(true);
    });

    it('should filter by namespace (exact match)', () => {
      const group = createGroup('test-group', 'production');
      expect(groupFilter(group, { namespace: 'production' })).toBe(true);
      expect(groupFilter(group, { namespace: 'staging' })).toBe(false);
    });

    it('should filter by namespace (fuzzy match)', () => {
      const group = createGroup('test-group', 'production-alerts');
      expect(groupFilter(group, { namespace: 'prod' })).toBe(true);
      expect(groupFilter(group, { namespace: 'staging' })).toBe(false);
    });

    it('should filter by group name (exact match)', () => {
      const group = createGroup('my-alerts', 'production');
      expect(groupFilter(group, { groupName: 'my-alerts' })).toBe(true);
      expect(groupFilter(group, { groupName: 'other-alerts' })).toBe(false);
    });

    it('should filter by group name (fuzzy match)', () => {
      const group = createGroup('production-alerts', 'namespace');
      expect(groupFilter(group, { groupName: 'alerts' })).toBe(true);
      expect(groupFilter(group, { groupName: 'recording' })).toBe(false);
    });

    it('should filter by both namespace and group name', () => {
      const group = createGroup('my-alerts', 'production');
      expect(groupFilter(group, { namespace: 'production', groupName: 'my-alerts' })).toBe(true);
      expect(groupFilter(group, { namespace: 'production', groupName: 'other' })).toBe(false);
      expect(groupFilter(group, { namespace: 'staging', groupName: 'my-alerts' })).toBe(false);
    });
  });

  describe('ruleFilter', () => {
    const createAlertingRule = (
      name: string,
      state: 'firing' | 'inactive' | 'pending' = 'inactive',
      labels: Record<string, string> = {}
    ): PromAlertingRuleDTO => ({
      name,
      query: 'up == 0',
      health: 'ok',
      type: 'alerting',
      state,
      labels,
    });

    const createRecordingRule = (name: string, labels: Record<string, string> = {}): PromRecordingRuleDTO => ({
      name,
      query: 'sum(up)',
      health: 'ok',
      type: 'recording',
      labels,
    });

    it('should return true when no filters are applied', () => {
      const rule = createAlertingRule('TestAlert');
      expect(ruleFilter(rule, {})).toBe(true);
    });

    describe('ruleName filter', () => {
      it('should filter by rule name (exact match)', () => {
        const rule = createAlertingRule('HighErrorRate');
        expect(ruleFilter(rule, { ruleName: 'HighErrorRate' })).toBe(true);
        expect(ruleFilter(rule, { ruleName: 'LowErrorRate' })).toBe(false);
      });

      it('should filter by rule name (fuzzy match)', () => {
        const rule = createAlertingRule('HighErrorRate');
        expect(ruleFilter(rule, { ruleName: 'Error' })).toBe(true);
        expect(ruleFilter(rule, { ruleName: 'Memory' })).toBe(false);
      });
    });

    describe('ruleType filter', () => {
      it('should filter alerting rules by type', () => {
        const alertingRule = createAlertingRule('TestAlert');
        expect(ruleFilter(alertingRule, { ruleType: 'alerting' })).toBe(true);
        expect(ruleFilter(alertingRule, { ruleType: 'recording' })).toBe(false);
      });

      it('should filter recording rules by type', () => {
        const recordingRule = createRecordingRule('test:metric:sum');
        expect(ruleFilter(recordingRule, { ruleType: 'recording' })).toBe(true);
        expect(ruleFilter(recordingRule, { ruleType: 'alerting' })).toBe(false);
      });
    });

    describe('ruleState filter', () => {
      it('should filter by firing state', () => {
        const firingRule = createAlertingRule('TestAlert', 'firing');
        const inactiveRule = createAlertingRule('TestAlert', 'inactive');
        expect(ruleFilter(firingRule, { ruleState: 'firing' })).toBe(true);
        expect(ruleFilter(inactiveRule, { ruleState: 'firing' })).toBe(false);
      });

      it('should filter by pending state', () => {
        const pendingRule = createAlertingRule('TestAlert', 'pending');
        const firingRule = createAlertingRule('TestAlert', 'firing');
        expect(ruleFilter(pendingRule, { ruleState: 'pending' })).toBe(true);
        expect(ruleFilter(firingRule, { ruleState: 'pending' })).toBe(false);
      });

      it('should treat inactive and normal as equivalent', () => {
        const inactiveRule = createAlertingRule('TestAlert', 'inactive');
        expect(ruleFilter(inactiveRule, { ruleState: 'normal' })).toBe(true);
        expect(ruleFilter(inactiveRule, { ruleState: 'inactive' })).toBe(true);
      });

      it('should exclude recording rules when filtering by state', () => {
        const recordingRule = createRecordingRule('test:metric:sum');
        expect(ruleFilter(recordingRule, { ruleState: 'firing' })).toBe(false);
        expect(ruleFilter(recordingRule, { ruleState: 'normal' })).toBe(false);
      });
    });

    describe('labels filter', () => {
      it('should filter by label equality', () => {
        const rule = createAlertingRule('TestAlert', 'firing', { severity: 'critical', team: 'platform' });
        expect(ruleFilter(rule, { labels: ['severity=critical'] })).toBe(true);
        expect(ruleFilter(rule, { labels: ['severity=warning'] })).toBe(false);
      });

      it('should filter by multiple labels', () => {
        const rule = createAlertingRule('TestAlert', 'firing', { severity: 'critical', team: 'platform' });
        expect(ruleFilter(rule, { labels: ['severity=critical', 'team=platform'] })).toBe(true);
        expect(ruleFilter(rule, { labels: ['severity=critical', 'team=backend'] })).toBe(false);
      });

      it('should return true when rule has no labels but label filter is empty', () => {
        const rule = createAlertingRule('TestAlert');
        expect(ruleFilter(rule, { labels: [] })).toBe(true);
      });
    });

    describe('combined filters', () => {
      it('should apply all filters together', () => {
        const rule = createAlertingRule('HighErrorRate', 'firing', { severity: 'critical' });
        expect(
          ruleFilter(rule, {
            ruleName: 'Error',
            ruleType: 'alerting',
            ruleState: 'firing',
            labels: ['severity=critical'],
          })
        ).toBe(true);

        // Fails one filter
        expect(
          ruleFilter(rule, {
            ruleName: 'Error',
            ruleType: 'alerting',
            ruleState: 'pending', // Wrong state
            labels: ['severity=critical'],
          })
        ).toBe(false);
      });
    });
  });
});
