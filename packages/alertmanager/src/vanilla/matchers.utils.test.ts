import { describe, it, expect } from 'vitest';
import {
  isPromQLStyleMatcher,
  matcherToObjectMatcher,
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
