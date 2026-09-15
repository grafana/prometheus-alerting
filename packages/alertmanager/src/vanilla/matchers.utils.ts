import { Matcher, Route } from './api/types/common';
import { TupleToUnion } from 'type-fest';

const matcherOperatorTokens = ['=~', '!~', '!=', '='] as const;
const commaUnlessQuoted = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;
const reservedMatcherCharacters = /[{}!=~,\\"'`\s]+/;

export type MatcherOperator = TupleToUnion<typeof matcherOperatorTokens>;

export const matcherOperators = {
  equals: '=',
  notEquals: '!=',
  matchesRegex: '=~',
  doesNotMatchRegex: '!~',
} as const satisfies Record<string, MatcherOperator>;

/** A matcher tuple whose name and value are semantic (decoded) strings. */
export type ObjectMatcher = [name: string, operator: MatcherOperator, value: string];

/**
 * Shared UI row shape for Alertmanager matcher editors.
 *
 * Syntax ownership is feature-specific: route rows preserve their legacy
 * textual matcher tokens, while inhibition rows contain semantic strings.
 */
export interface MatcherFieldValue {
  name: string;
  value: string;
  operator: MatcherOperator;
}

export const emptyMatcherFieldValue: MatcherFieldValue = {
  name: '',
  value: '',
  operator: matcherOperators.equals,
};

/**
 * We need to deal with multiple (deprecated) properties such as "match" and "match_re"
 * this function will normalize all of the different ways to define matchers in to a single one.
 */
export function normalizeMatchers(route: Route): ObjectMatcher[] {
  const currentMatchers = (route.matchers ?? []).flatMap(parseObjectMatcherExpression);
  const deprecatedRegexMatchers = Object.entries(route.match_re ?? {}).map(
    ([name, value]): ObjectMatcher => [name, '=~', value]
  );
  const deprecatedEqualityMatchers = Object.entries(route.match ?? {}).map(
    ([name, value]): ObjectMatcher => [name, '=', value]
  );

  return [...currentMatchers, ...deprecatedRegexMatchers, ...deprecatedEqualityMatchers];
}

export function matcherToObjectMatcher(matcher: Matcher): ObjectMatcher {
  const operator = matcherToOperator(matcher);
  return [matcher.name, operator, matcher.value];
}

function matcherToOperator(matcher: Matcher): MatcherOperator {
  if (matcher.isEqual) {
    if (matcher.isRegex) {
      return '=~';
    } else {
      return '=';
    }
  } else if (matcher.isRegex) {
    return '!~';
  } else {
    return '!=';
  }
}

/**
 * This function combines parseMatcher and parsePromQLStyleMatcher, always returning an array of Matcher[] regardless of input syntax
 * 1. { foo=bar, bar=baz }
 * 2. foo=bar
 */
export function parseMatcherToArray(matcher: string): Matcher[] {
  return isPromQLStyleMatcher(matcher) ? parsePromQLStyleMatcher(matcher) : [parseMatcher(matcher)];
}

export function isPromQLStyleMatcher(input: string): boolean {
  return input.startsWith('{') && input.endsWith('}');
}

/**
 * This function turns a PromQL-style matchers like { foo="bar", bar!=baz } in to an array of Matchers
 */
export function parsePromQLStyleMatcher(matcher: string): Matcher[] {
  if (!isPromQLStyleMatcher(matcher)) {
    throw new Error('not a PromQL style matcher');
  }

  return parsePromQLStyleMatcherLoose(matcher);
}

/**
 * Parse a single matcher, examples:
 *  foo="bar" => { name: foo, value: bar, isRegex: false, isEqual: true }
 *  bar!~baz => { name: bar, value: baz, isRegex: true, isEqual: false }
 */
export function parseMatcher(matcher: string): Matcher {
  if (matcher.startsWith('{') && matcher.endsWith('}')) {
    throw new Error(
      'this function does not support PromQL-style matcher syntax, call parsePromQLStyleMatcher() instead'
    );
  }

  const operatorsFound = matcherOperatorTokens
    .map((op): [MatcherOperator, number] => [op, matcher.indexOf(op)])
    .filter(([_, idx]) => idx > -1)
    .sort((a, b) => a[1] - b[1]);

  if (!operatorsFound.length) {
    throw new Error(`Invalid matcher: ${matcher}`);
  }
  const [operator, idx] = operatorsFound[0];
  const name = matcher.slice(0, idx).trim();
  const value = matcher.slice(idx + operator.length);
  if (!name) {
    throw new Error(`Invalid matcher: ${matcher}`);
  }

  return {
    name,
    value,
    isRegex: operator === '=~' || operator === '!~',
    isEqual: operator === '=' || operator === '=~',
  };
}

/**
 * This function behaves the same as "parsePromQLStyleMatcher" but does not check if the matcher is formatted with { }
 * In other words; it accepts both "{ foo=bar, bar=baz }" and "foo=bar,bar=baz"
 * @throws
 */
export function parsePromQLStyleMatcherLoose(matcher: string): Matcher[] {
  return splitMatcherExpression(matcher)
    .flatMap(parseMatcher)
    .map((matcher) => ({
      ...matcher,
      name: unquoteWithUnescape(matcher.name),
      value: unquoteWithUnescape(matcher.value),
    }));
}

/**
 * This function behaves the same as "parsePromQLStyleMatcherLoose" but instead of throwing an error for incorrect syntax
 * it returns an empty Array of matchers instead.
 */
export function parsePromQLStyleMatcherLooseSafe(matcher: string): Matcher[] {
  try {
    return parsePromQLStyleMatcherLoose(matcher);
  } catch {
    return [];
  }
}

/**
 * Unquotes and unescapes a string **if it has been quoted**
 */
export function unquoteWithUnescape(input: string) {
  if (!/^"(.*)"$/.test(input)) {
    return input;
  }

  return input
    .replace(/^"(.*)"$/, '$1')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

export function stringifyObjectMatcher([name, operator, value]: ObjectMatcher) {
  const unquotedName = unquoteWithUnescape(name);

  // Unquoted value can be an empty string which we want to display as ""
  const unquotedValue = unquoteWithUnescape(value) || '""';
  return `${unquotedName} ${operator} ${unquotedValue}`;
}

/**
 * Decodes a quoted Alertmanager matcher token into the semantic value edited by inhibit-rule forms.
 *
 * Unlike the legacy route helper unquoteWithUnescape, this decodes `\n` and processes escapes in one
 * pass so a literal `\\n` remains distinct from a newline. Grafana core has no shared decoder for this;
 * these are Alertmanager's classic matcher escape rules.
 */
export function unquoteSemanticMatcherToken(input: string): string {
  if (!/^"(.*)"$/s.test(input)) {
    return input;
  }

  const contents = input.slice(1, -1);
  let unescaped = '';
  for (let index = 0; index < contents.length; index++) {
    const character = contents[index];
    const next = contents[index + 1];
    if (character === '\\' && (next === '"' || next === '\\' || next === 'n')) {
      unescaped += next === 'n' ? '\n' : next;
      index++;
    } else {
      unescaped += character;
    }
  }
  return unescaped;
}

function splitMatcherExpression(expression: string): string[] {
  return expression
    .replace(/^\{/, '')
    .replace(/\}$/, '')
    .trim()
    .split(commaUnlessQuoted)
    .filter((part) => part.trim().length > 0);
}

/** Parses matcher syntax into semantic tuples using Grafana core's operator and list rules. */
export function parseObjectMatcherExpression(expression: string): ObjectMatcher[] {
  return splitMatcherExpression(expression).map((part): ObjectMatcher => {
    const [name, operator, value] = matcherToObjectMatcher(parseMatcher(part));
    return [unquoteSemanticMatcherToken(name), operator, unquoteSemanticMatcherToken(value.trim())];
  });
}

/** Encodes a semantic matcher tuple using Grafana core's matcher quoting rules. */
export function encodeObjectMatcher([name, operator, value]: ObjectMatcher): string {
  return `${quoteMatcherTokenIfRequired(name)}${operator}${quoteMatcherToken(value)}`;
}

function quoteMatcherTokenIfRequired(input: string): string {
  return reservedMatcherCharacters.test(input) ? quoteMatcherToken(input) : input;
}

function quoteMatcherToken(input: string): string {
  const escaped = input.replace(/[\\"\n]/g, (character) => (character === '\n' ? '\\n' : `\\${character}`));
  return `"${escaped}"`;
}

/** Formats a semantic matcher tuple for UI display. */
export function formatObjectMatcherForDisplay([name, operator, value]: ObjectMatcher): string {
  return `${name} ${operator} ${value || '""'}`;
}
