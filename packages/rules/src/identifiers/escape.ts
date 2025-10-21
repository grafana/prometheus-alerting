/**
 * String escaping utilities for safe serialization of identifiers
 */

/**
 * Escape dollar signs to avoid conflicts with the separator
 */
export function escapeDollars(value: string): string {
  return value.replace(/\$/g, '_DOLLAR_');
}

/**
 * Unescape dollar signs
 */
export function unescapeDollars(value: string): string {
  return value.replace(/\_DOLLAR\_/g, '$');
}

/**
 * Escape path separators (/ and \) to avoid conflicts
 */
export function escapePathSeparators(value: string): string {
  return value.replace(/\//g, '\x1f').replace(/\\/g, '\x1e');
}

/**
 * Unescape path separators
 */
export function unescapePathSeparators(value: string): string {
  return value.replace(/\x1f/g, '/').replace(/\x1e/g, '\\');
}
