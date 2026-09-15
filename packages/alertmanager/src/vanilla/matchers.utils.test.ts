import { describe, it, expect } from 'vitest';
import {
  encodeObjectMatcher,
  formatObjectMatcherForDisplay,
  isPromQLStyleMatcher,
  matcherToObjectMatcher,
  normalizeMatchers,
  normalizeMatchersForMatching,
  parseMatcherToArray,
  parseMatcher,
  parseObjectMatcherExpression,
  parsePromQLStyleMatcher,
  parsePromQLStyleMatcherLoose,
  parsePromQLStyleMatcherLooseSafe,
  stringifyObjectMatcher,
  unquoteSemanticMatcherToken,
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

describe('normalizeMatchersForMatching', () => {
  it('decodes modern matcher syntax for every operator', () => {
    expect(
      normalizeMatchersForMatching({
        matchers: [' severity = "critical" ', 'team != "ops"', 'service =~ "api.*"', 'zone !~ "dev.*"'],
      })
    ).toEqual([
      ['severity', '=', 'critical'],
      ['team', '!=', 'ops'],
      ['service', '=~', 'api.*'],
      ['zone', '!~', 'dev.*'],
    ]);
  });

  it('decodes quoted values exactly once', () => {
    expect(
      normalizeMatchersForMatching({
        matchers: [
          'empty = ""',
          'spaces = " keep me "',
          'quoted = "\\"critical\\""',
          'newline = "line\\nnext"',
          'literal = "line\\\\nnext"',
          'path = "C:\\\\alerts"',
        ],
      })
    ).toEqual([
      ['empty', '=', ''],
      ['spaces', '=', ' keep me '],
      ['quoted', '=', '"critical"'],
      ['newline', '=', 'line\nnext'],
      ['literal', '=', 'line\\nnext'],
      ['path', '=', 'C:\\alerts'],
    ]);
  });

  it('handles braced matchers and commas without double decoding', () => {
    expect(normalizeMatchersForMatching({ matchers: ['{service="api,worker",message="\\"critical\\""}'] })).toEqual([
      ['service', '=', 'api,worker'],
      ['message', '=', '"critical"'],
    ]);
  });

  it('preserves legacy map values verbatim', () => {
    expect(
      normalizeMatchersForMatching({
        match: { quoted: '"literal"', whitespace: ' keep me ' },
        match_re: { path: 'C:\\alerts' },
      })
    ).toEqual([
      ['path', '=~', 'C:\\alerts'],
      ['quoted', '=', '"literal"'],
      ['whitespace', '=', ' keep me '],
    ]);
  });

  it('throws for malformed modern matchers', () => {
    expect(() => normalizeMatchersForMatching({ matchers: ['invalid'] })).toThrow('Invalid matcher');
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

describe('parseObjectMatcherExpression', () => {
  it('parses all core-supported operators', () => {
    expect(parseObjectMatcherExpression('a=one,b!=two,c=~three,d!~four')).toEqual<ObjectMatcher[]>([
      ['a', '=', 'one'],
      ['b', '!=', 'two'],
      ['c', '=~', 'three'],
      ['d', '!~', 'four'],
    ]);
  });

  it('parses quoted names, values, and commas in values', () => {
    expect(parseObjectMatcherExpression('{"team name"="ops,platform",region="us"}')).toEqual<ObjectMatcher[]>([
      ['team name', '=', 'ops,platform'],
      ['region', '=', 'us'],
    ]);
  });

  it('supports empty quoted and unquoted values and ordinary Unicode', () => {
    expect(parseObjectMatcherExpression('quoted="",unquoted=,service="日本語 🚨"')).toEqual<ObjectMatcher[]>([
      ['quoted', '=', ''],
      ['unquoted', '=', ''],
      ['service', '=', '日本語 🚨'],
    ]);
  });
});

describe('unquoteSemanticMatcherToken', () => {
  it('unescapes quote, backslash, and newline in one pass', () => {
    expect(unquoteSemanticMatcherToken(String.raw`"a\nb\\c\"d"`)).toBe('a\nb\\c"d');
  });

  it('keeps literal backslash-n distinct from a line feed', () => {
    expect(unquoteSemanticMatcherToken(String.raw`"a\\nb"`)).toBe(String.raw`a\nb`);
    expect(unquoteSemanticMatcherToken(String.raw`"a\nb"`)).toBe('a\nb');
  });
});

describe('encodeObjectMatcher', () => {
  it.each<{ matcher: ObjectMatcher }>([
    { matcher: ['message', '=', String.raw`a\nb`] },
    { matcher: ['message', '=', 'a\nb'] },
    { matcher: ['team name', '=~', '日本語 "primary"'] },
    { matcher: ['empty', '!~', ''] },
  ])('round-trips the semantic tuple $matcher', ({ matcher }) => {
    expect(parseObjectMatcherExpression(encodeObjectMatcher(matcher))).toEqual([matcher]);
  });

  it('encodes literal backslash-n differently from an actual line feed', () => {
    expect(encodeObjectMatcher(['message', '=', String.raw`a\nb`])).toBe(String.raw`message="a\\nb"`);
    expect(encodeObjectMatcher(['message', '=', 'a\nb'])).toBe(String.raw`message="a\nb"`);
  });

  it('uses core quoting semantics for reserved names and preserves ordinary Unicode names', () => {
    expect(encodeObjectMatcher(['team name', '=', 'ops'])).toBe('"team name"="ops"');
    expect(encodeObjectMatcher(['🚨', '=', 'active'])).toBe('🚨="active"');
  });
});

describe('formatObjectMatcherForDisplay', () => {
  it('displays semantic values without applying legacy lexical unquoting', () => {
    expect(formatObjectMatcherForDisplay(['team', '=', '"ops"'])).toBe('team = "ops"');
  });
});
