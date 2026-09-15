/**
 * Core hashing utilities used by identifiers and fingerprinting
 */

import { parsePrometheusDuration } from '../utils/duration';

/**
 * Simple hash function for strings
 */
export function simpleHash(value: string): number {
  let hash = 0;
  if (value.length === 0) {
    return hash;
  }
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Hash labels or annotations for fingerprinting
 */
export function hashLabelsOrAnnotations(item: Record<string, string> | undefined): string {
  return JSON.stringify(Object.entries(item || {}).sort((a, b) => a[0].localeCompare(b[0])));
}

/**
 * Strips PromQL comments from a query string.
 * Handles both full-line comments (lines starting with #) and inline comments
 * (# appearing after code on the same line, e.g. `or # fallback condition`).
 * Mimir normalizes expressions by stripping comments before storing them in
 * Prometheus state, so the ruler expression and the Prometheus query must be
 * processed identically before comparison.
 */
export function stripPromQLComments(query: string): string {
  return query
    .replace(/#[^\n]*/g, '') // strip from # to end of line (inline and full-line comments)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => Boolean(line))
    .join('\n');
}

/**
 * Finds either a quoted string or a PromQL duration, whichever comes first.
 *
 * A duration is one or more `<number><unit>` parts, e.g. `5m`, `1h30m`, `500ms`. The lookbehind
 * and lookahead keep us from matching a duration-looking tail inside a longer name, so a recording
 * rule called `job:latency:rate5m` is left alone.
 *
 * Quoted strings (double, single and backtick) are matched first and on purpose: a label value can
 * be spelled like a duration without being one, and `{window="60m"}` and `{window="1h"}` select
 * different series. Because the scan runs left to right, an opening quote swallows the whole
 * literal, so a duration inside it is never considered.
 *
 * Unlike the anchored duration patterns elsewhere in the app, this one scans a whole expression,
 * so it can't be shared with them.
 */
const PROMQL_STRING_OR_DURATION_REGEX =
  /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`)|(?<![\w.])(?:\d+(?:ms|[smhdwy]))+(?![\w.])/g;

/**
 * Rewrites every duration in a query to a plain number of milliseconds, leaving the contents of
 * quoted strings alone.
 *
 * Mimir parses the expression and prints it back out when it exposes the rule through the
 * Prometheus rules API, and printing picks the largest unit that fits. A hand-written `[60m:]` in
 * the ruler YAML therefore comes back as `[1h:]`, which would otherwise hash differently.
 */
export function normalizePromQLDurations(query: string): string {
  return query.replace(PROMQL_STRING_OR_DURATION_REGEX, (match, quotedString?: string) => {
    if (quotedString !== undefined) {
      return quotedString;
    }

    try {
      return `${parsePrometheusDuration(match)}ms`;
    } catch {
      // Anything the regex above matched should parse, but hashQuery runs on every rule we render,
      // so if it ever doesn't we leave the duration as written rather than throwing.
      return match;
    }
  });
}

/**
 * Hash a query string for fingerprinting
 */
export function hashQuery(query: string): string {
  // remove comments (full-line and inline)
  query = stripPromQLComments(query);

  // `60m` and `1h` mean the same thing but don't look the same
  query = normalizePromQLDurations(query);

  // one of them might be wrapped in parens
  if (query.length > 1 && query[0] === '(' && query[query.length - 1] === ')') {
    query = query.slice(1, -1);
  }

  return query.trim();
}
