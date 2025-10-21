/**
 * Core hashing utilities used by identifiers and fingerprinting
 */

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
 * Hash a query string for fingerprinting
 */
export function hashQuery(query: string): string {
  // remove comments
  query = query
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .join('\n');

  // one of them might be wrapped in parens
  if (query.length > 1 && query[0] === '(' && query[query.length - 1] === ')') {
    query = query.slice(1, -1);
  }

  return query.trim();
}
