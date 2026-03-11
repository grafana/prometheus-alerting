import {
  matchersStringToArray,
  matchersArrayToString,
  inhibitRuleToFormData,
  formDataToInhibitRule,
  normalizedInhibitRuleToInhibitRule,
} from './InhibitRuleFormFields';

describe('matchersStringToArray', () => {
  it('splits a newline-separated string into an array', () => {
    expect(matchersStringToArray('severity = critical\nteam = ops')).toEqual(['severity = critical', 'team = ops']);
  });

  it('trims whitespace from each line', () => {
    expect(matchersStringToArray('  severity = critical  \n  team = ops  ')).toEqual([
      'severity = critical',
      'team = ops',
    ]);
  });

  it('filters out blank lines', () => {
    expect(matchersStringToArray('a = b\n\nc = d')).toEqual(['a = b', 'c = d']);
  });

  it('returns an empty array for an empty string', () => {
    expect(matchersStringToArray('')).toEqual([]);
  });

  it('returns an empty array for a whitespace-only string', () => {
    expect(matchersStringToArray('  \n  \n  ')).toEqual([]);
  });

  it('handles a single matcher with no newline', () => {
    expect(matchersStringToArray('severity = critical')).toEqual(['severity = critical']);
  });
});

describe('matchersArrayToString', () => {
  it('joins an array with newlines', () => {
    expect(matchersArrayToString(['severity = critical', 'team = ops'])).toBe('severity = critical\nteam = ops');
  });

  it('returns an empty string for an empty array', () => {
    expect(matchersArrayToString([])).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(matchersArrayToString(undefined)).toBe('');
  });

  it('returns the single element with no trailing newline', () => {
    expect(matchersArrayToString(['foo = bar'])).toBe('foo = bar');
  });
});

describe('inhibitRuleToFormData', () => {
  it('converts all fields correctly', () => {
    expect(
      inhibitRuleToFormData({
        source_matchers: ['severity = critical', 'team = ops'],
        target_matchers: ['severity = warning'],
        equal: ['alertname', 'instance'],
      })
    ).toEqual({
      sourceMatchers: 'severity = critical\nteam = ops',
      targetMatchers: 'severity = warning',
      equal: 'alertname, instance',
    });
  });

  it('produces an empty equal string when equal is undefined', () => {
    expect(inhibitRuleToFormData({ source_matchers: ['a = b'], target_matchers: ['c = d'] })).toEqual({
      sourceMatchers: 'a = b',
      targetMatchers: 'c = d',
      equal: '',
    });
  });

  it('produces an empty equal string when equal is an empty array', () => {
    expect(inhibitRuleToFormData({ source_matchers: ['a = b'], target_matchers: ['c = d'], equal: [] })).toEqual({
      sourceMatchers: 'a = b',
      targetMatchers: 'c = d',
      equal: '',
    });
  });

  it('produces empty matcher strings when source/target matchers are undefined', () => {
    expect(inhibitRuleToFormData({ source_matchers: undefined, target_matchers: undefined })).toEqual({
      sourceMatchers: '',
      targetMatchers: '',
      equal: '',
    });
  });
});

describe('formDataToInhibitRule', () => {
  it('converts all fields correctly', () => {
    expect(
      formDataToInhibitRule({
        sourceMatchers: 'severity = critical\nteam = ops',
        targetMatchers: 'severity = warning',
        equal: 'alertname, instance',
      })
    ).toEqual({
      source_matchers: ['severity = critical', 'team = ops'],
      target_matchers: ['severity = warning'],
      equal: ['alertname', 'instance'],
    });
  });

  it('sets equal to undefined when equal is an empty string', () => {
    expect(formDataToInhibitRule({ sourceMatchers: 'a = b', targetMatchers: 'c = d', equal: '' })).toEqual({
      source_matchers: ['a = b'],
      target_matchers: ['c = d'],
      equal: undefined,
    });
  });

  it('trims whitespace around comma-separated equal labels', () => {
    expect(
      formDataToInhibitRule({ sourceMatchers: 'a = b', targetMatchers: 'c = d', equal: ' alertname , instance ' })
    ).toEqual({
      source_matchers: ['a = b'],
      target_matchers: ['c = d'],
      equal: ['alertname', 'instance'],
    });
  });

  it('is a lossless round-trip with inhibitRuleToFormData', () => {
    const rule = {
      source_matchers: ['severity = critical', 'team =~ ops.*'],
      target_matchers: ['severity != warning'],
      equal: ['alertname', 'instance'],
    };
    expect(formDataToInhibitRule(inhibitRuleToFormData(rule))).toEqual(rule);
  });
});

describe('normalizedInhibitRuleToInhibitRule', () => {
  it('serialises ObjectMatcher tuples back to matcher strings', () => {
    expect(
      normalizedInhibitRuleToInhibitRule({
        source_matchers: [['severity', '=', 'critical']],
        target_matchers: [['severity', '=', 'warning']],
        equal: ['alertname'],
      })
    ).toEqual({
      source_matchers: ['severity = critical'],
      target_matchers: ['severity = warning'],
      equal: ['alertname'],
    });
  });

  it('handles all four matcher operators', () => {
    const { source_matchers } = normalizedInhibitRuleToInhibitRule({
      source_matchers: [
        ['a', '=', 'b'],
        ['c', '!=', 'd'],
        ['e', '=~', 'f.*'],
        ['g', '!~', 'h.*'],
      ],
      target_matchers: [],
    });
    expect(source_matchers).toEqual(['a = b', 'c != d', 'e =~ f.*', 'g !~ h.*']);
  });

  it('preserves equal labels unchanged', () => {
    const equal = ['alertname', 'instance', 'cluster'];
    expect(normalizedInhibitRuleToInhibitRule({ source_matchers: [], target_matchers: [], equal })).toMatchObject({
      equal,
    });
  });

  it('preserves undefined equal', () => {
    expect(normalizedInhibitRuleToInhibitRule({ source_matchers: [], target_matchers: [] })).toMatchObject({
      equal: undefined,
    });
  });
});
