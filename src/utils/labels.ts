/**
 * Label matching utilities for filtering alert rules
 * Supports label matchers like: team=frontend, severity!=low, region=~us-.*, cluster!~test.*
 */

export interface Matcher {
  name: string;
  operator: '=' | '!=' | '=~' | '!~';
  value: string;
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
      return {
        name: regexMatch[1],
        operator: regexMatch[2] as '=~' | '!~',
        value: regexMatch[3],
      };
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
        } catch (error) {
          // Invalid regex, treat as no match
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
        } catch (error) {
          // Invalid regex, treat as no match (negated = match)
          return true;
        }

      default:
        return false;
    }
  });
}
