import { renderHook } from '@testing-library/react';

import type { PromRuleGroupDTO, RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { useGroupConsistencyCheck } from './useGroupConsistencyCheck';

describe('useGroupConsistencyCheck', () => {
  const createPromGroup = (rules: Array<{ name: string; type: 'alerting' | 'recording' }>): PromRuleGroupDTO => ({
    name: 'test-group',
    file: 'test-namespace',
    interval: 60,
    rules: rules.map((r) =>
      r.type === 'alerting'
        ? {
            name: r.name,
            query: 'up == 1',
            health: 'ok',
            type: 'alerting' as const,
            state: 'inactive' as const,
          }
        : {
            name: r.name,
            query: 'up == 1',
            health: 'ok',
            type: 'recording' as const,
          }
    ),
  });

  const createRulerGroup = (rules: Array<{ name: string; type: 'alerting' | 'recording' }>): RulerRuleGroupDTO => ({
    name: 'test-group',
    interval: '1m',
    rules: rules.map((r) =>
      r.type === 'alerting' ? { alert: r.name, expr: 'up == 1' } : { record: r.name, expr: 'up == 1' }
    ),
  });

  describe('when Ruler API is not enabled', () => {
    it('should return in sync and canCheck false', () => {
      const promGroup = createPromGroup([{ name: 'rule1', type: 'alerting' }]);

      const { result } = renderHook(() => useGroupConsistencyCheck(promGroup, undefined, false));

      expect(result.current).toEqual({
        isInSync: true,
        canCheck: false,
      });
    });
  });

  describe('when Ruler API is enabled', () => {
    it('should return in sync when both groups have same rules', () => {
      const promGroup = createPromGroup([
        { name: 'rule1', type: 'alerting' },
        { name: 'rule2', type: 'recording' },
      ]);
      const rulerGroup = createRulerGroup([
        { name: 'rule1', type: 'alerting' },
        { name: 'rule2', type: 'recording' },
      ]);

      const { result } = renderHook(() => useGroupConsistencyCheck(promGroup, rulerGroup, true));

      expect(result.current).toEqual({
        isInSync: true,
        canCheck: true,
      });
    });

    it('should detect rule count mismatch', () => {
      const promGroup = createPromGroup([{ name: 'rule1', type: 'alerting' }]);
      const rulerGroup = createRulerGroup([
        { name: 'rule1', type: 'alerting' },
        { name: 'rule2', type: 'alerting' },
      ]);

      const { result } = renderHook(() => useGroupConsistencyCheck(promGroup, rulerGroup, true));

      expect(result.current.isInSync).toBe(false);
      expect(result.current.canCheck).toBe(true);
      expect(result.current.syncIssue).toContain('Rule count mismatch');
    });

    it('should detect rule name mismatch', () => {
      const promGroup = createPromGroup([
        { name: 'rule1', type: 'alerting' },
        { name: 'rule2', type: 'alerting' },
      ]);
      const rulerGroup = createRulerGroup([
        { name: 'rule1', type: 'alerting' },
        { name: 'different-rule', type: 'alerting' },
      ]);

      const { result } = renderHook(() => useGroupConsistencyCheck(promGroup, rulerGroup, true));

      expect(result.current.isInSync).toBe(false);
      expect(result.current.canCheck).toBe(true);
      expect(result.current.syncIssue).toContain('Rule order or names differ');
    });

    it('should detect when group exists in ruler but not in prometheus', () => {
      const rulerGroup = createRulerGroup([{ name: 'rule1', type: 'alerting' }]);

      const { result } = renderHook(() => useGroupConsistencyCheck(undefined, rulerGroup, true));

      expect(result.current.isInSync).toBe(false);
      expect(result.current.canCheck).toBe(true);
      expect(result.current.syncIssue).toContain('not yet visible in Prometheus');
    });

    it('should detect when group exists in prometheus but not in ruler', () => {
      const promGroup = createPromGroup([{ name: 'rule1', type: 'alerting' }]);

      const { result } = renderHook(() => useGroupConsistencyCheck(promGroup, undefined, true));

      expect(result.current.isInSync).toBe(false);
      expect(result.current.canCheck).toBe(true);
      expect(result.current.syncIssue).toContain('not found in configuration');
    });

    it('should handle null rulerGroup', () => {
      const promGroup = createPromGroup([{ name: 'rule1', type: 'alerting' }]);

      const { result } = renderHook(() => useGroupConsistencyCheck(promGroup, null, true));

      expect(result.current.isInSync).toBe(false);
      expect(result.current.canCheck).toBe(true);
    });

    it('should return canCheck false when both groups are undefined', () => {
      const { result } = renderHook(() => useGroupConsistencyCheck(undefined, undefined, true));

      expect(result.current).toEqual({
        isInSync: true,
        canCheck: false,
      });
    });
  });
});
