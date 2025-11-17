import { describe, it, test, expect } from 'vitest';
import { InhibitRule, Matcher, Route } from './api/types/common';

import {
  isPromQLStyleMatcher,
  matcherToObjectMatcher,
  normalizeInhibitRuleMatchers,
  normalizeMatchers,
  ObjectMatcher,
  parseMatcher,
  parsePromQLStyleMatcher,
  parsePromQLStyleMatcherLoose,
  parsePromQLStyleMatcherLooseSafe,
  unquoteWithUnescape,
} from './matchers.utils';

describe('Prometheus matcher utilities', () => {
  describe('normalizeMatchers', () => {
    const eq = '=';
    const neq = '!=';

    it('should work for matchers', () => {
      const route: Route = { matchers: ['foo=bar', 'foo!=bar', 'foo=~bar', 'foo!~bar'] };
      expect(normalizeMatchers(route)).toEqual<ObjectMatcher[]>([
        ['foo', '=', 'bar'],
        ['foo', '!=', 'bar'],
        ['foo', '=~', 'bar'],
        ['foo', '!~', 'bar'],
      ]);
    });
    it('should work for match and match_re', () => {
      const route: Route = { match: { foo: 'bar' }, match_re: { foo: 'bar' } };
      expect(normalizeMatchers(route)).toEqual<ObjectMatcher[]>([
        ['foo', '=~', 'bar'],
        ['foo', '=', 'bar'],
      ]);
    });
    it('should work with PromQL style matchers', () => {
      const route: Route = {
        matchers: ['{ foo=bar, baz!=qux }'],
      };
      expect(normalizeMatchers(route)).toEqual<ObjectMatcher[]>([
        ['foo', eq, 'bar'],
        ['baz', neq, 'qux'],
      ]);
    });
  });

  describe('normalizeInhibitRuleMatchers', () => {
    const eq = '=';
    const neq = '!=';
    const regex = '=~';
    const notRegex = '!~';

    it('should normalize source_matchers and target_matchers', () => {
      const inhibitRule: InhibitRule = {
        source_matchers: ['severity=critical', 'alertname=HostDown'],
        target_matchers: ['severity=warning', 'alertname!=HostDown'],
        equal: ['instance'],
      };

      const normalized = normalizeInhibitRuleMatchers(inhibitRule);

      expect(normalized.source_matchers).toEqual<ObjectMatcher[]>([
        ['severity', eq, 'critical'],
        ['alertname', eq, 'HostDown'],
      ]);
      expect(normalized.target_matchers).toEqual<ObjectMatcher[]>([
        ['severity', eq, 'warning'],
        ['alertname', neq, 'HostDown'],
      ]);
      expect(normalized.equal).toEqual(['instance']);
    });

    it('should work with PromQL style matchers', () => {
      const inhibitRule: InhibitRule = {
        source_matchers: ['{ severity=critical, region=~us-.* }'],
        target_matchers: ['{ severity=warning, region!~eu-.* }'],
      };

      const normalized = normalizeInhibitRuleMatchers(inhibitRule);

      expect(normalized.source_matchers).toEqual<ObjectMatcher[]>([
        ['severity', eq, 'critical'],
        ['region', regex, 'us-.*'],
      ]);
      expect(normalized.target_matchers).toEqual<ObjectMatcher[]>([
        ['severity', eq, 'warning'],
        ['region', notRegex, 'eu-.*'],
      ]);
    });

    it('should handle empty matchers', () => {
      const inhibitRule: InhibitRule = {
        equal: ['instance'],
      };

      const normalized = normalizeInhibitRuleMatchers(inhibitRule);

      expect(normalized.source_matchers).toEqual([]);
      expect(normalized.target_matchers).toEqual([]);
      expect(normalized.equal).toEqual(['instance']);
    });

    it('should normalize deprecated source_match and source_match_re', () => {
      const inhibitRule: InhibitRule = {
        source_match: { severity: 'critical', alertname: 'HostDown' },
        source_match_re: { region: 'us-.*' },
        target_matchers: ['severity=warning'],
      };

      const normalized = normalizeInhibitRuleMatchers(inhibitRule);

      expect(normalized.source_matchers).toEqual<ObjectMatcher[]>([
        ['region', regex, 'us-.*'],
        ['severity', eq, 'critical'],
        ['alertname', eq, 'HostDown'],
      ]);
      expect(normalized.target_matchers).toEqual<ObjectMatcher[]>([['severity', eq, 'warning']]);
      // Deprecated properties should be omitted
      expect(normalized).not.toHaveProperty('source_match');
      expect(normalized).not.toHaveProperty('source_match_re');
    });

    it('should normalize deprecated target_match and target_match_re', () => {
      const inhibitRule: InhibitRule = {
        source_matchers: ['severity=critical'],
        target_match: { severity: 'warning', alertname: 'ServiceDown' },
        target_match_re: { region: 'eu-.*' },
      };

      const normalized = normalizeInhibitRuleMatchers(inhibitRule);

      expect(normalized.source_matchers).toEqual<ObjectMatcher[]>([['severity', eq, 'critical']]);
      expect(normalized.target_matchers).toEqual<ObjectMatcher[]>([
        ['region', regex, 'eu-.*'],
        ['severity', eq, 'warning'],
        ['alertname', eq, 'ServiceDown'],
      ]);
      // Deprecated properties should be omitted
      expect(normalized).not.toHaveProperty('target_match');
      expect(normalized).not.toHaveProperty('target_match_re');
    });

    it('should combine current and deprecated properties', () => {
      const inhibitRule: InhibitRule = {
        source_matchers: ['severity=critical'],
        source_match: { instance: 'host-1' },
        target_matchers: ['severity=warning'],
        target_match_re: { job: 'node-.*' },
        equal: ['instance'],
      };

      const normalized = normalizeInhibitRuleMatchers(inhibitRule);

      // Both current and deprecated properties should be merged
      expect(normalized.source_matchers).toEqual<ObjectMatcher[]>([
        ['severity', eq, 'critical'],
        ['instance', eq, 'host-1'],
      ]);
      expect(normalized.target_matchers).toEqual<ObjectMatcher[]>([
        ['severity', eq, 'warning'],
        ['job', regex, 'node-.*'],
      ]);
      expect(normalized.equal).toEqual(['instance']);
      // All deprecated properties should be omitted
      expect(normalized).not.toHaveProperty('source_match');
      expect(normalized).not.toHaveProperty('source_match_re');
      expect(normalized).not.toHaveProperty('target_match');
      expect(normalized).not.toHaveProperty('target_match_re');
    });
  });
});

describe('parseMatcher', () => {
  it('should be able to parse a simple matcher', () => {
    expect(parseMatcher('foo=bar')).toStrictEqual({ name: 'foo', value: 'bar', isRegex: false, isEqual: true });
  });
  it('should throw when parsing PromQL-style matcher', () => {
    expect(() => parseMatcher('{ foo=bar }')).toThrow();
  });
});

describe('unquoteWithUnescape', () => {
  const samples: string[][] = [
    ['bar', 'bar'],
    ['"bar"', 'bar'],
    ['"b\\"ar\\""', 'b"ar"'],
    ['"b\\\\ar\\\\"', 'b\\ar\\'],
    ['"wa{r}ni$ng!"', 'wa{r}ni$ng!'],
  ];

  it.each(samples)('should unquote and unescape %s to %s', (quoted, raw) => {
    const unquotedMatcher = unquoteWithUnescape(quoted);
    expect(unquotedMatcher).toBe(raw);
  });

  it('should not unescape unquoted string', () => {
    const unquoted = unquoteWithUnescape('un\\"quo\\\\ted');
    expect(unquoted).toBe('un\\"quo\\\\ted');
  });
});

describe('isPromQLStyleMatcher', () => {
  it('should detect promQL style matcher', () => {
    expect(isPromQLStyleMatcher('{ foo=bar }')).toBe(true);
    expect(isPromQLStyleMatcher('foo=bar')).toBe(false);
  });
});

describe('matcherToObjectMatcher', () => {
  test.each([
    { matcher: { name: 'foo', value: 'bar', isRegex: false, isEqual: true }, expected: ['foo', '=', 'bar'] },
    { matcher: { name: 'foo', value: 'bar', isRegex: true, isEqual: true }, expected: ['foo', '=~', 'bar'] },
    { matcher: { name: 'foo', value: 'bar', isRegex: true, isEqual: false }, expected: ['foo', '!~', 'bar'] },
    { matcher: { name: 'foo', value: 'bar', isRegex: false, isEqual: false }, expected: ['foo', '!=', 'bar'] },
  ])('.matcherToObjectMatcher($matcher)', ({ matcher, expected }) => {
    expect(matcherToObjectMatcher(matcher)).toStrictEqual(expected);
  });
});

describe('parsePromQLStyleMatcher', () => {
  it('should decode PromQL style matcher', () => {
    expect(parsePromQLStyleMatcher('{ foo="bar"}')).toStrictEqual([
      {
        name: 'foo',
        value: 'bar',
        isEqual: true,
        isRegex: false,
      },
    ]);
  });

  it('should split only on comma when not used as a label key or value', () => {
    expect(parsePromQLStyleMatcher('{ "key1,key2"="value1,value2"}')).toStrictEqual([
      {
        name: 'key1,key2',
        value: 'value1,value2',
        isEqual: true,
        isRegex: false,
      },
    ]);
  });

  it('should remove empty matchers from array', () => {
    expect(parsePromQLStyleMatcher('{ foo=bar, }')).toStrictEqual([
      { name: 'foo', value: 'bar', isEqual: true, isRegex: false },
    ]);
  });

  it('should throw when not using correct syntax', () => {
    expect(() => parsePromQLStyleMatcher('foo="bar"')).toThrow();
  });
});

describe('parsePromQLStyleMatcherLooseSafe', () => {
  it('should parse all operators', () => {
    expect(parsePromQLStyleMatcherLooseSafe('foo=bar, bar=~ba.+, severity!=warning, email!~@grafana.com')).toEqual<
      Matcher[]
    >([
      { name: 'foo', value: 'bar', isRegex: false, isEqual: true },
      { name: 'bar', value: 'ba.+', isEqual: true, isRegex: true },
      { name: 'severity', value: 'warning', isRegex: false, isEqual: false },
      { name: 'email', value: '@grafana.com', isRegex: true, isEqual: false },
    ]);
  });

  it('should parse with spaces and brackets', () => {
    expect(parsePromQLStyleMatcherLooseSafe('{ foo=bar }')).toEqual<Matcher[]>([
      {
        name: 'foo',
        value: 'bar',
        isRegex: false,
        isEqual: true,
      },
    ]);
  });

  it('should parse with spaces in the value', () => {
    expect(parsePromQLStyleMatcherLooseSafe('foo=bar bazz')).toEqual<Matcher[]>([
      {
        name: 'foo',
        value: 'bar bazz',
        isRegex: false,
        isEqual: true,
      },
    ]);
  });

  it('should return nothing for invalid operator', () => {
    expect(parsePromQLStyleMatcherLooseSafe('foo=!bar')).toEqual([
      {
        name: 'foo',
        value: '!bar',
        isRegex: false,
        isEqual: true,
      },
    ]);
  });

  it('should parse matchers with or without quotes', () => {
    expect(parsePromQLStyleMatcherLooseSafe('foo="bar",bar=bazz')).toEqual<Matcher[]>([
      { name: 'foo', value: 'bar', isRegex: false, isEqual: true },
      { name: 'bar', value: 'bazz', isEqual: true, isRegex: false },
    ]);
  });

  it('should parse matchers for key with special characters', () => {
    expect(parsePromQLStyleMatcherLooseSafe('foo.bar-baz="bar",baz-bar.foo=bazz')).toEqual<Matcher[]>([
      { name: 'foo.bar-baz', value: 'bar', isRegex: false, isEqual: true },
      { name: 'baz-bar.foo', value: 'bazz', isEqual: true, isRegex: false },
    ]);
  });
});

describe('parsePromQLStyleMatcherLoose', () => {
  it('should throw on invalid matcher', () => {
    expect(() => {
      parsePromQLStyleMatcherLoose('foo');
    }).toThrow();

    expect(() => {
      parsePromQLStyleMatcherLoose('foo;bar');
    }).toThrow();
  });

  it('should return empty array for empty input', () => {
    expect(parsePromQLStyleMatcherLoose('')).toStrictEqual([]);
  });

  it('should also accept { } syntax', () => {
    expect(parsePromQLStyleMatcherLoose('{ foo=bar, bar=baz }')).toStrictEqual([
      { isEqual: true, isRegex: false, name: 'foo', value: 'bar' },
      { isEqual: true, isRegex: false, name: 'bar', value: 'baz' },
    ]);
  });
});
