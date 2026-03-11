import { defaultFormValuesForRuleType, translateRouteParamToRuleType } from './formDefaults';
import { RuleFormType } from './types';

describe('defaultFormValuesForRuleType', () => {
  it('returns defaults for cloudAlerting with correct type', () => {
    const defaults = defaultFormValuesForRuleType(RuleFormType.cloudAlerting);
    expect(defaults.type).toBe(RuleFormType.cloudAlerting);
    expect(defaults.name).toBe('');
    expect(defaults.dataSourceUid).toBeNull();
    expect(defaults.labels).toEqual([{ key: '', value: '' }]);
    expect(defaults.annotations).toEqual([]);
    expect(defaults.forTime).toBe(0);
    expect(defaults.forTimeUnit).toBe('s');
  });

  it('returns defaults for cloudRecording with correct type', () => {
    const defaults = defaultFormValuesForRuleType(RuleFormType.cloudRecording);
    expect(defaults.type).toBe(RuleFormType.cloudRecording);
  });

  it('returns a frozen object', () => {
    const defaults = defaultFormValuesForRuleType(RuleFormType.cloudAlerting);
    expect(Object.isFrozen(defaults)).toBe(true);
  });
});

describe('translateRouteParamToRuleType', () => {
  it('returns cloudRecording for "recording"', () => {
    expect(translateRouteParamToRuleType('recording')).toBe(RuleFormType.cloudRecording);
  });

  it('returns cloudAlerting for any other string', () => {
    expect(translateRouteParamToRuleType('alerting')).toBe(RuleFormType.cloudAlerting);
    expect(translateRouteParamToRuleType('unknown')).toBe(RuleFormType.cloudAlerting);
  });

  it('returns cloudAlerting for empty string (default)', () => {
    expect(translateRouteParamToRuleType('')).toBe(RuleFormType.cloudAlerting);
  });

  it('returns cloudAlerting when called with no argument', () => {
    expect(translateRouteParamToRuleType()).toBe(RuleFormType.cloudAlerting);
  });
});
