import { Matcher, Route } from './api/types/common';
import { TupleToUnion } from 'type-fest';

const matcherOperators = ['=~', '!~', '!=', '='] as const;
export type MatcherOperator = TupleToUnion<typeof matcherOperators>;

export type ObjectMatcher = [name: string, operator: MatcherOperator, value: string];

/**
 * We need to deal with multiple (deprecated) properties such as "match" and "match_re"
 * this function will normalize all of the different ways to define matchers in to a single one.
 */
export const normalizeMatchers = (route: Route): ObjectMatcher[] => {
  let routeMatchers: ObjectMatcher[] = [];

  if (route.matchers) {
    route.matchers.forEach((matcher) => {
      const parsedMatchers = parseMatcherToArray(matcher).map(matcherToObjectMatcher);
      routeMatchers = routeMatchers.concat(parsedMatchers);
    });
  }

  if (route.match_re) {
    Object.entries(route.match_re).forEach(([label, value]) => {
      routeMatchers.push([label, '=~', value]);
    });
  }

  if (route.match) {
    Object.entries(route.match).forEach(([label, value]) => {
      routeMatchers.push([label, '=', value]);
    });
  }

  return routeMatchers;
};

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

  const operatorsFound = matcherOperators
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
  // split by `,` but not when it's used as a label value
  const commaUnlessQuoted = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/;
  const parts = matcher.replace(/^\{/, '').replace(/\}$/, '').trim().split(commaUnlessQuoted);

  return parts
    .filter((part) => part.trim().length > 0) // Filter out empty strings before parsing
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
