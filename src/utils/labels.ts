/**
 * Label matching utilities for filtering alert rules
 * Supports label matchers like: team=frontend, severity!=low, region=~us-.*, cluster!~test.*
 */

import {
  MatcherOperator,
  parsePromQLStyleMatcherLoose,
  type Matcher as AlertmanagerMatcher,
} from '@grafana/external-alertmanager/vanilla';

export interface Matcher {
  name: string;
  operator: MatcherOperator;
  value: string;
}

export type MatcherParseResult = { matchers: Matcher[]; error?: never } | { matchers: []; error: Error };

export function parseMatchers(input: string): MatcherParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { matchers: [] };
  }

  try {
    const matchers = parsePromQLStyleMatcherLoose(trimmed).map(toMatcher);
    const hasInvalidRegex = matchers.some(
      (matcher) => (matcher.operator === '=~' || matcher.operator === '!~') && !isValidRegex(matcher.value)
    );
    return matchers.length > 0 && !hasInvalidRegex ? { matchers } : invalidMatcherParseResult();
  } catch {
    const singleMatcher = trimmed.includes(',') ? undefined : looseParseMatcher(trimmed);
    return singleMatcher ? { matchers: [singleMatcher] } : invalidMatcherParseResult();
  }
}

function invalidMatcherParseResult(): MatcherParseResult {
  return { matchers: [], error: new Error('Invalid matcher syntax') };
}

function toMatcher(matcher: AlertmanagerMatcher): Matcher {
  return {
    name: matcher.name,
    value: matcher.value,
    operator: matcher.isRegex ? (matcher.isEqual ? '=~' : '!~') : matcher.isEqual ? '=' : '!=',
  };
}

function isValidRegex(value: string): boolean {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the number of labels in a labels object
 */
export function labelsSize(labels: Record<string, string>): number {
  return Object.keys(labels).length;
}

/**
 * Parse a label matcher string into a Matcher object
 * Supports operators: =, !=, =~, !~
 * Examples: "team=frontend", "severity!=low", "region=~us-.*", "cluster!~test.*"
 */
export function looseParseMatcher(matcherQuery: string): Matcher | undefined {
  try {
    // Try to match the different operator patterns
    // Order matters: check longer operators first (!=, =~, !~) before single char (=)
    const regexMatch = matcherQuery.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(=~|!~)(.+)$/);
    if (regexMatch) {
      const matcher: Matcher = {
        name: regexMatch[1],
        operator: regexMatch[2] as '=~' | '!~',
        value: regexMatch[3],
      };
      return isValidRegex(matcher.value) ? matcher : undefined;
    }

    const notEqualMatch = matcherQuery.match(/^([a-zA-Z_][a-zA-Z0-9_]*)!=(.+)$/);
    if (notEqualMatch) {
      return {
        name: notEqualMatch[1],
        operator: '!=',
        value: notEqualMatch[2],
      };
    }

    const equalMatch = matcherQuery.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=(.+)$/);
    if (equalMatch) {
      return {
        name: equalMatch[1],
        operator: '=',
        value: equalMatch[2],
      };
    }

    // If no operator found, treat as exact match with empty value
    // This handles cases like "label:team" (just label name without value)
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(matcherQuery)) {
      return {
        name: matcherQuery,
        operator: '=',
        value: '',
      };
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Check if a set of labels matches a set of matchers
 * All matchers must match for the function to return true (AND logic)
 */
export function labelsMatchMatchers(labels: Record<string, string>, matchers: Matcher[]): boolean {
  return matchers.every((matcher) => {
    const labelValue = labels[matcher.name];

    switch (matcher.operator) {
      case '=':
        // Exact match - if matcher value is empty, just check if label exists
        if (matcher.value === '') {
          return labelValue !== undefined;
        }
        return labelValue === matcher.value;

      case '!=':
        // Not equal - if matcher value is empty, check if label doesn't exist
        if (matcher.value === '') {
          return labelValue === undefined;
        }
        return labelValue !== matcher.value;

      case '=~':
        // Regex match
        if (!labelValue) {
          return false;
        }
        try {
          const regex = new RegExp(matcher.value);
          return regex.test(labelValue);
        } catch {
          return false;
        }

      case '!~':
        // Negative regex match
        if (!labelValue) {
          return true; // Label doesn't exist, so it doesn't match the regex
        }
        try {
          const regex = new RegExp(matcher.value);
          return !regex.test(labelValue);
        } catch {
          return false;
        }

      default:
        return false;
    }
  });
}

/**
 * Labels wrapped in double underscores are internal bookkeeping added by Grafana or the
 * Alertmanager (for example `__alert_rule_uid__`). They're not useful to match a silence on,
 * so we leave them out when we build matchers from an alert's labels.
 */
export function isPrivateLabelKey(labelKey: string): boolean {
  return labelKey.startsWith('__') && labelKey.endsWith('__');
}
