import { describe, expect, it } from 'vitest';

import { type InhibitRule } from './api/types/common';
import {
  encodeSemanticInhibitMatcher,
  formatInhibitMatcherForDisplay,
  normalizeInhibitRuleMatchers,
  parseInhibitMatcherExpression,
  type NormalizedInhibitRule,
  type SemanticInhibitMatcher,
} from './inhibitMatchers';

describe('normalizeInhibitRuleMatchers', () => {
  describe('normalization and source ordering', () => {
    it('normalizes current source and target matcher syntax', () => {
      const rule: InhibitRule = {
        source_matchers: ['severity=critical', 'alertname=HostDown'],
        target_matchers: ['severity=warning', 'alertname!=HostDown'],
        equal: ['instance'],
      };

      expect(normalizeInhibitRuleMatchers(rule)).toMatchObject<NormalizedInhibitRule>({
        source_matchers: [
          ['severity', '=', 'critical'],
          ['alertname', '=', 'HostDown'],
        ],
        target_matchers: [
          ['severity', '=', 'warning'],
          ['alertname', '!=', 'HostDown'],
        ],
        equal: ['instance'],
      });
    });

    it('normalizes brace-contained comma-separated matchers', () => {
      const rule: InhibitRule = {
        source_matchers: ['{ severity=critical, region=~us-.* }'],
        target_matchers: ['{ severity=warning, region!~eu-.* }'],
      };

      expect(normalizeInhibitRuleMatchers(rule)).toMatchObject<NormalizedInhibitRule>({
        source_matchers: [
          ['severity', '=', 'critical'],
          ['region', '=~', 'us-.*'],
        ],
        target_matchers: [
          ['severity', '=', 'warning'],
          ['region', '!~', 'eu-.*'],
        ],
      });
    });

    it('retains an empty current matcher list', () => {
      expect(normalizeInhibitRuleMatchers({ equal: ['instance'] })).toMatchObject({
        source_matchers: [],
        target_matchers: [],
        equal: ['instance'],
      });
    });

    it('appends deprecated source regex matchers before source equality matchers', () => {
      const normalized = normalizeInhibitRuleMatchers({
        source_match: { severity: 'critical', alertname: 'HostDown' },
        source_match_re: { region: 'us-.*' },
        target_matchers: ['severity=warning'],
      });

      expect(normalized.source_matchers).toEqual<SemanticInhibitMatcher[]>([
        ['region', '=~', 'us-.*'],
        ['severity', '=', 'critical'],
        ['alertname', '=', 'HostDown'],
      ]);
      expect(normalized.target_matchers).toEqual<SemanticInhibitMatcher[]>([['severity', '=', 'warning']]);
      expect(normalized).not.toHaveProperty('source_match');
      expect(normalized).not.toHaveProperty('source_match_re');
    });

    it('appends deprecated target regex matchers before target equality matchers', () => {
      const normalized = normalizeInhibitRuleMatchers({
        source_matchers: ['severity=critical'],
        target_match: { severity: 'warning', alertname: 'ServiceDown' },
        target_match_re: { region: 'eu-.*' },
      });

      expect(normalized.source_matchers).toEqual<SemanticInhibitMatcher[]>([['severity', '=', 'critical']]);
      expect(normalized.target_matchers).toEqual<SemanticInhibitMatcher[]>([
        ['region', '=~', 'eu-.*'],
        ['severity', '=', 'warning'],
        ['alertname', '=', 'ServiceDown'],
      ]);
      expect(normalized).not.toHaveProperty('target_match');
      expect(normalized).not.toHaveProperty('target_match_re');
    });

    it('combines current and deprecated sources without changing their order', () => {
      const normalized = normalizeInhibitRuleMatchers({
        source_matchers: ['severity=critical'],
        source_match: { instance: 'host-1' },
        target_matchers: ['severity=warning'],
        target_match_re: { job: 'node-.*' },
        equal: ['instance'],
      });

      expect(normalized.source_matchers).toEqual<SemanticInhibitMatcher[]>([
        ['severity', '=', 'critical'],
        ['instance', '=', 'host-1'],
      ]);
      expect(normalized.target_matchers).toEqual<SemanticInhibitMatcher[]>([
        ['severity', '=', 'warning'],
        ['job', '=~', 'node-.*'],
      ]);
      expect(normalized.equal).toEqual(['instance']);
    });

    it('keeps deprecated map values as already-semantic strings', () => {
      const result = normalizeInhibitRuleMatchers({
        source_match: { foo: 'bar' },
        target_match_re: { baz: 'qux' },
      });

      expect(result.source_matchers).toEqual<SemanticInhibitMatcher[]>([['foo', '=', 'bar']]);
      expect(result.target_matchers).toEqual<SemanticInhibitMatcher[]>([['baz', '=~', 'qux']]);
    });
  });
});

describe('parseInhibitMatcherExpression', () => {
  describe('fallback dialect and classic decoding', () => {
    it('decodes classic quote, backslash, and newline escapes', () => {
      expect(parseInhibitMatcherExpression(String.raw`message="a\nb\\c\"d"`)).toEqual<SemanticInhibitMatcher[]>([
        ['message', '=', 'a\nb\\c"d'],
      ]);
    });

    it('preserves unknown classic tab and carriage-return escapes', () => {
      expect(parseInhibitMatcherExpression(String.raw`message="a\tb\rc"`)).toEqual<SemanticInhibitMatcher[]>([
        ['message', '=', String.raw`a\tb\rc`],
      ]);
    });

    it('keeps already-physical tab and carriage-return controls', () => {
      expect(parseInhibitMatcherExpression('message="a\tb\rc"')).toEqual<SemanticInhibitMatcher[]>([
        ['message', '=', 'a\tb\rc'],
      ]);
    });

    it('uses classic results for legacy label names when dialects disagree', () => {
      expect(parseInhibitMatcherExpression(String.raw`message="a\tb\x41\u0042"`)).toEqual<SemanticInhibitMatcher[]>([
        ['message', '=', String.raw`a\tb\x41\u0042`],
      ]);
    });

    it('uses classic semantics for colon label names', () => {
      expect(parseInhibitMatcherExpression(String.raw`foo:bar="a\tb"`)).toEqual<SemanticInhibitMatcher[]>([
        ['foo:bar', '=', String.raw`a\tb`],
      ]);
    });

    it('keeps unquoted UTF-8-only values raw because Go decoding requires quotes', () => {
      expect(parseInhibitMatcherExpression(String.raw`🚨=a\nb`)).toEqual<SemanticInhibitMatcher[]>([
        ['🚨', '=', String.raw`a\nb`],
      ]);
    });
  });

  describe('Go quoted decoding', () => {
    it('uses UTF-8 quoting for special label names and values', () => {
      expect(parseInhibitMatcherExpression('"team name"="日本語 \\"primary\\"", "🚨"!="a,b{c}=~d"')).toEqual<
        SemanticInhibitMatcher[]
      >([
        ['team name', '=', '日本語 "primary"'],
        ['🚨', '!=', 'a,b{c}=~d'],
      ]);
    });

    it('decodes an escaped line feed in a quoted UTF-8 matcher name', () => {
      expect(parseInhibitMatcherExpression(String.raw`"line\nname"="value"`)).toEqual<SemanticInhibitMatcher[]>([
        ['line\nname', '=', 'value'],
      ]);
    });

    it('decodes byte, octal, and Unicode escapes as semantic strings', () => {
      expect(parseInhibitMatcherExpression(String.raw`"🚨"="\xc3\xa9 \360\237\231\202 \u65e5\U0001F680"`)).toEqual<
        SemanticInhibitMatcher[]
      >([['🚨', '=', 'é 🙂 日🚀']]);
    });

    it('rejects a raw unpaired low surrogate in quoted UTF-8 syntax', () => {
      const rawLowSurrogate = '\udc00';

      expect(() => parseInhibitMatcherExpression(`"🚨"="${rawLowSurrogate}"`)).toThrow('Invalid UTF-8 matcher value');
    });

    it.each([String.raw`"🚨"="\xff"`, String.raw`"🚨"="\12"`, String.raw`"🚨"="\uD800"`])(
      'rejects invalid UTF-8 quoted escapes: %s',
      (matcher) => {
        expect(() => parseInhibitMatcherExpression(matcher)).toThrow('Invalid UTF-8 matcher');
      }
    );

    it('accepts the \\377 octal boundary before rejecting out-of-range \\400', () => {
      expect(() => parseInhibitMatcherExpression(String.raw`"🚨"="\377"`)).toThrow('Invalid UTF-8 matcher byte escape');
      expect(() => parseInhibitMatcherExpression(String.raw`"🚨"="\400"`)).toThrow(
        'Invalid UTF-8 matcher octal escape'
      );
    });
  });

  describe('malformed syntax', () => {
    it('accepts optional outer braces and unquoted empty values', () => {
      expect(parseInhibitMatcherExpression(' {team="ops,platform",empty=""} ')).toEqual<SemanticInhibitMatcher[]>([
        ['team', '=', 'ops,platform'],
        ['empty', '=', ''],
      ]);
      expect(parseInhibitMatcherExpression('unquoted=')).toEqual<SemanticInhibitMatcher[]>([['unquoted', '=', '']]);
      expect(parseInhibitMatcherExpression('spaced=   ')).toEqual<SemanticInhibitMatcher[]>([['spaced', '=', '']]);
    });

    it.each(['team="unterminated', 'team="unescaped " quote"', '"team name="value"'])(
      'rejects malformed matcher syntax without converting it: %s',
      (matcher) => {
        expect(() => parseInhibitMatcherExpression(matcher)).toThrow('Invalid matcher');
      }
    );
  });
});

describe('canonical encoding', () => {
  it.each<{ matcher: SemanticInhibitMatcher }>([
    { matcher: ['message', '=', String.raw`a\nb`] },
    { matcher: ['foo:bar', '!=', String.raw`a\tb`] },
    { matcher: ['team name', '=~', '日本語 "primary"'] },
    { matcher: ['   ', '=', ''] },
    { matcher: ['🚨', '!~', ''] },
  ])('round-trips the semantic tuple $matcher', ({ matcher }) => {
    const encoded = encodeSemanticInhibitMatcher(matcher);

    expect(parseInhibitMatcherExpression(encoded)).toEqual([matcher]);
    expect(encodeSemanticInhibitMatcher(parseInhibitMatcherExpression(encoded)[0])).toBe(encoded);
  });

  it('preserves classic unquoted escape semantics when canonicalizing', () => {
    const [matcher] = parseInhibitMatcherExpression(String.raw`message=a\nb`);

    expect(matcher).toEqual<SemanticInhibitMatcher>(['message', '=', 'a\nb']);
    expect(encodeSemanticInhibitMatcher(matcher)).toBe(String.raw`message="a\nb"`);
  });
});

describe('semantic display', () => {
  it('does not apply legacy lexical unquoting', () => {
    expect(formatInhibitMatcherForDisplay(['team', '=', '"ops"'])).toBe('team = "ops"');
  });
});
