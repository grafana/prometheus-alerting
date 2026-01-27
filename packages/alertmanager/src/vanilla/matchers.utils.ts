import { InhibitRule, Matcher, Route } from './api/types/common';
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

/**
 * Normalized inhibit rule with matchers converted to ObjectMatcher arrays
 * and deprecated properties omitted
 */
export type NormalizedInhibitRule = Omit<
  InhibitRule,
  'source_matchers' | 'target_matchers' | 'source_match' | 'source_match_re' | 'target_match' | 'target_match_re'
> & {
  source_matchers: ObjectMatcher[];
  target_matchers: ObjectMatcher[];
};

/**
 * Normalizes the matchers in an inhibit rule from string arrays to ObjectMatcher arrays.
 * This function handles both current and deprecated properties:
 * - source_matchers / target_matchers (current)
 * - source_match / source_match_re (deprecated)
 * - target_match / target_match_re (deprecated)
 *
 * The deprecated properties are normalized into the new format and then omitted from the result.
 */
export const normalizeInhibitRuleMatchers = (inhibitRule: InhibitRule): NormalizedInhibitRule => {
  const sourceMatchers: ObjectMatcher[] = [];
  const targetMatchers: ObjectMatcher[] = [];

  // Parse source_matchers (current property)
  if (inhibitRule.source_matchers) {
    inhibitRule.source_matchers.forEach((matcher) => {
      const parsedMatchers = parseMatcherToArray(matcher).map(matcherToObjectMatcher);
      sourceMatchers.push(...parsedMatchers);
    });
  }

  // Parse source_match_re (deprecated)
  if (inhibitRule.source_match_re) {
    Object.entries(inhibitRule.source_match_re).forEach(([label, value]) => {
      sourceMatchers.push([label, '=~', value]);
    });
  }

  // Parse source_match (deprecated)
  if (inhibitRule.source_match) {
    Object.entries(inhibitRule.source_match).forEach(([label, value]) => {
      sourceMatchers.push([label, '=', value]);
    });
  }

  // Parse target_matchers (current property)
  if (inhibitRule.target_matchers) {
    inhibitRule.target_matchers.forEach((matcher) => {
      const parsedMatchers = parseMatcherToArray(matcher).map(matcherToObjectMatcher);
      targetMatchers.push(...parsedMatchers);
    });
  }

  // Parse target_match_re (deprecated)
  if (inhibitRule.target_match_re) {
    Object.entries(inhibitRule.target_match_re).forEach(([label, value]) => {
      targetMatchers.push([label, '=~', value]);
    });
  }

  // Parse target_match (deprecated)
  if (inhibitRule.target_match) {
    Object.entries(inhibitRule.target_match).forEach(([label, value]) => {
      targetMatchers.push([label, '=', value]);
    });
  }

  // Omit deprecated properties from the result
  const { source_match, source_match_re, target_match, target_match_re, ...restOfRule } = inhibitRule;

  return {
    ...restOfRule,
    source_matchers: sourceMatchers,
    target_matchers: targetMatchers,
  };
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
