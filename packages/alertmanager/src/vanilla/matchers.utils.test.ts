import { describe, it, expect } from 'vitest';
import {
  isPromQLStyleMatcher,
  matcherToObjectMatcher,
  normalizeInhibitRuleMatchers,
  normalizeMatchers,
  parseMatcherToArray,
  parseMatcher,
  parsePromQLStyleMatcher,
  parsePromQLStyleMatcherLoose,
  parsePromQLStyleMatcherLooseSafe,
  stringifyObjectMatcher,
  unquoteWithUnescape,
  type ObjectMatcher,
} from './matchers.utils';

describe('isPromQLStyleMatcher', () => {
  it('returns true for { } wrapped matchers', () => {
    expect(isPromQLStyleMatcher('{foo="bar"}')).toBe(true);
  });

  it('returns false for plain matchers', () => {
    expect(isPromQLStyleMatcher('foo="bar"')).toBe(false);
    expect(isPromQLStyleMatcher('{foo="bar"')).toBe(false);
    expect(isPromQLStyleMatcher('foo="bar"}')).toBe(false);
  });
});

describe('parseMatcher', () => {
  it('parses = operator', () => {
    expect(parseMatcher('foo=bar')).toEqual({ name: 'foo', value: 'bar', isRegex: false, isEqual: true });
  });

  it('parses != operator', () => {
    expect(parseMatcher('foo!=bar')).toEqual({ name: 'foo', value: 'bar', isRegex: false, isEqual: false });
  });

  it('parses =~ operator', () => {
    expect(parseMatcher('foo=~bar')).toEqual({ name: 'foo', value: 'bar', isRegex: true, isEqual: true });
  });

  it('parses !~ operator', () => {
    expect(parseMatcher('foo!~bar')).toEqual({ name: 'foo', value: 'bar', isRegex: true, isEqual: false });
  });

  it('throws for PromQL-style input', () => {
    expect(() => parseMatcher('{foo="bar"}')).toThrow();
  });

  it('throws when no operator is found', () => {
    expect(() => parseMatcher('foobar')).toThrow('Invalid matcher');
  });

  it('throws when name is empty', () => {
    expect(() => parseMatcher('=bar')).toThrow('Invalid matcher');
  });
});

describe('parsePromQLStyleMatcher', () => {
  it('parses multiple matchers', () => {
    const result = parsePromQLStyleMatcher('{foo="bar",baz!~"qux"}');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'foo', value: 'bar', isRegex: false, isEqual: true });
    expect(result[1]).toEqual({ name: 'baz', value: 'qux', isRegex: true, isEqual: false });
  });

  it('throws for non-PromQL input', () => {
    expect(() => parsePromQLStyleMatcher('foo=bar')).toThrow('not a PromQL style matcher');
  });
});

describe('parseMatcherToArray', () => {
  it('returns array for plain matcher', () => {
    const result = parseMatcherToArray('foo=bar');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('foo');
  });

  it('returns array for PromQL-style matcher', () => {
    const result = parseMatcherToArray('{foo="bar",baz="qux"}');
    expect(result).toHaveLength(2);
  });
});

describe('matcherToObjectMatcher', () => {
  it('converts equal non-regex matcher', () => {
    expect(matcherToObjectMatcher({ name: 'foo', value: 'bar', isEqual: true, isRegex: false })).toEqual([
      'foo',
      '=',
      'bar',
    ]);
  });

  it('converts regex equal matcher', () => {
    expect(matcherToObjectMatcher({ name: 'foo', value: 'bar', isEqual: true, isRegex: true })).toEqual([
      'foo',
      '=~',
      'bar',
    ]);
  });

  it('converts not-equal matcher', () => {
    expect(matcherToObjectMatcher({ name: 'foo', value: 'bar', isEqual: false, isRegex: false })).toEqual([
      'foo',
      '!=',
      'bar',
    ]);
  });

  it('converts not-regex matcher', () => {
    expect(matcherToObjectMatcher({ name: 'foo', value: 'bar', isEqual: false, isRegex: true })).toEqual([
      'foo',
      '!~',
      'bar',
    ]);
  });
});

describe('normalizeMatchers', () => {
  it('normalizes matchers array', () => {
    const result = normalizeMatchers({ receiver: 'r', matchers: ['foo=bar'] });
    expect(result).toEqual([['foo', '=', 'bar']]);
  });

  it('normalizes match (deprecated)', () => {
    const result = normalizeMatchers({ receiver: 'r', match: { foo: 'bar' } });
    expect(result).toEqual([['foo', '=', 'bar']]);
  });

  it('normalizes match_re (deprecated)', () => {
    const result = normalizeMatchers({ receiver: 'r', match_re: { foo: 'bar.*' } });
    expect(result).toEqual([['foo', '=~', 'bar.*']]);
  });

  it('returns empty array with no matchers', () => {
    expect(normalizeMatchers({ receiver: 'r' })).toEqual([]);
  });
});

describe('normalizeInhibitRuleMatchers', () => {
  it('normalizes source and target matchers', () => {
    const result = normalizeInhibitRuleMatchers({
      source_matchers: ['foo=bar'],
      target_matchers: ['baz!=qux'],
    });
    expect(result.source_matchers).toEqual([['foo', '=', 'bar']]);
    expect(result.target_matchers).toEqual([['baz', '!=', 'qux']]);
  });

  it('turns deprecated map values into safe editable tokens', () => {
    const result = normalizeInhibitRuleMatchers({
      source_match: { foo: 'bar' },
      target_match_re: { baz: 'qux' },
    });
    expect(result.source_matchers).toEqual([['foo', '=', '"bar"']]);
    expect(result.target_matchers).toEqual([['baz', '=~', '"qux"']]);
    expect(result).not.toHaveProperty('source_match');
    expect(result).not.toHaveProperty('target_match_re');
  });

  it('handles empty rule', () => {
    const result = normalizeInhibitRuleMatchers({});
    expect(result.source_matchers).toEqual([]);
    expect(result.target_matchers).toEqual([]);
  });

  it('preserves quoted current matcher syntax without decoding escapes', () => {
    const result = normalizeInhibitRuleMatchers({
      source_matchers: ['team = "ops"', 'message!=" leading and trailing "'],
      target_matchers: ['path=~"C:\\\\temp\\\\.*"'],
    });

    expect(result.source_matchers).toEqual([
      ['team', '=', '"ops"'],
      ['message', '!=', '" leading and trailing "'],
    ]);
    expect(result.target_matchers).toEqual([['path', '=~', '"C:\\\\temp\\\\.*"']]);
  });

  it('preserves brace syntax and safely quotes deprecated literal values', () => {
    const result = normalizeInhibitRuleMatchers({
      source_matchers: ['{team="ops",empty=""}'],
      source_match: { literal: '"ops"' },
      source_match_re: { path: 'C:\\temp\\.*' },
      target_matchers: ['severity!~"warning|info"'],
    });

    expect(result.source_matchers).toEqual([
      ['team', '=', '"ops"'],
      ['empty', '=', '""'],
      ['path', '=~', '"C:\\\\temp\\\\.*"'],
      ['literal', '=', '"\\"ops\\""'],
    ]);
    expect(result.target_matchers).toEqual([['severity', '!~', '"warning|info"']]);
  });

  it('keeps lexical backslash escapes and makes literal line feeds editable', () => {
    const result = normalizeInhibitRuleMatchers({
      source_matchers: ['{team = "ops", message = "a\\nb", literal="a\nb"}'],
      target_matchers: ['path="literal\\\\n"'],
    });

    expect(result.source_matchers).toEqual([
      ['team', '=', '"ops"'],
      ['message', '=', '"a\\nb"'],
      ['literal', '=', '"a\\nb"'],
    ]);
    expect(result.target_matchers).toEqual([['path', '=', '"literal\\\\n"']]);
  });

  it('preserves literal line-feed semantics around backslash runs', () => {
    const lineFeed = '\n';
    const normalized = normalizeInhibitRuleMatchers({
      source_matchers: [`zero="a${lineFeed}b"`, `one="a\\${lineFeed}b"`, `two="a\\\\${lineFeed}b"`],
      target_matchers: ['target="value"'],
    });

    expect(normalized.source_matchers).toEqual([
      ['zero', '=', String.raw`"a\nb"`],
      ['one', '=', String.raw`"a\\\nb"`],
      ['two', '=', String.raw`"a\\\nb"`],
    ]);
  });

  it('does not reinterpret malformed quoted modern values', () => {
    const result = normalizeInhibitRuleMatchers({
      source_matchers: ['team="unterminated'],
    });

    expect(result.source_matchers).toEqual([['team', '=', '"unterminated']]);
  });
});

describe('parsePromQLStyleMatcherLoose', () => {
  it('parses without curly braces', () => {
    const result = parsePromQLStyleMatcherLoose('foo="bar"');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('foo');
    expect(result[0].value).toBe('bar');
  });

  it('handles comma in quoted value', () => {
    const result = parsePromQLStyleMatcherLoose('foo="a,b",bar="c"');
    expect(result).toHaveLength(2);
  });

  it('unquotes name and value', () => {
    const result = parsePromQLStyleMatcherLoose('foo="bar"');
    expect(result[0].value).toBe('bar');
  });
});

describe('parsePromQLStyleMatcherLooseSafe', () => {
  it('returns empty array on parse error', () => {
    expect(parsePromQLStyleMatcherLooseSafe('!!!invalid')).toEqual([]);
  });

  it('returns parsed matchers on success', () => {
    const result = parsePromQLStyleMatcherLooseSafe('foo=bar');
    expect(result).toHaveLength(1);
  });
});

describe('unquoteWithUnescape', () => {
  it('returns unquoted string', () => {
    expect(unquoteWithUnescape('"foo"')).toBe('foo');
  });

  it('returns original string if not quoted', () => {
    expect(unquoteWithUnescape('foo')).toBe('foo');
  });

  it('unescapes inner quotes', () => {
    expect(unquoteWithUnescape('"foo\\"bar"')).toBe('foo"bar');
  });

  it('unescapes backslashes', () => {
    expect(unquoteWithUnescape('"foo\\\\bar"')).toBe('foo\\bar');
  });
});

describe('stringifyObjectMatcher', () => {
  it('formats a basic matcher', () => {
    const m: ObjectMatcher = ['foo', '=', 'bar'];
    expect(stringifyObjectMatcher(m)).toBe('foo = bar');
  });

  it('formats with quoted name', () => {
    const m: ObjectMatcher = ['"foo"', '!=', 'bar'];
    expect(stringifyObjectMatcher(m)).toBe('foo != bar');
  });

  it('uses "" for empty value', () => {
    const m: ObjectMatcher = ['foo', '=', ''];
    expect(stringifyObjectMatcher(m)).toBe('foo = ""');
  });
});
