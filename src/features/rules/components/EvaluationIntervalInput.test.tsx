import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';

import { validateInterval } from './EvaluationIntervalInput';

const alertingRule = (forDuration: string): RulerRuleDTO => ({
  alert: 'HighErrorRate',
  expr: 'up == 0',
  for: forDuration,
});
const recordingRule: RulerRuleDTO = { record: 'my:recording:rule', expr: 'up == 0' };

describe('validateInterval', () => {
  it('accepts a valid interval with no rules to check against', () => {
    expect(validateInterval('1m')).toBeUndefined();
  });

  it.each(['bogus99', 'not-a-duration', ''])('rejects an invalid duration format (%s)', (interval) => {
    expect(validateInterval(interval)).toBe('Invalid duration format. Use formats like 1m, 30s, 1h.');
  });

  it.each(['1d', '1w'])('accepts day/week durations (%s)', (interval) => {
    expect(validateInterval(interval)).toBeUndefined();
  });

  it("rejects an interval that exceeds a rule's pending period", () => {
    const message = validateInterval('10m', [alertingRule('5m')]);
    expect(message).toBe(
      'Interval (10m) exceeds the pending period (5m) of some rules. This may cause alerts to fire immediately.'
    );
  });

  it("accepts an interval within a rule's pending period", () => {
    expect(validateInterval('1m', [alertingRule('5m')])).toBeUndefined();
  });

  it('ignores recording rules, which have no pending period', () => {
    expect(validateInterval('10m', [recordingRule])).toBeUndefined();
  });
});
