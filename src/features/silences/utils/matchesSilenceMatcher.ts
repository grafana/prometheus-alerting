import type { Matcher } from '@grafana/external-alertmanager/vanilla';

/**
 * Checks whether a filter matcher matches a silence matcher.
 *
 * Unlike exact equality (matching on all four fields), this function applies
 * the filter's operator against the silence matcher's value only — ignoring
 * the silence matcher's own operator. This means:
 *  - foo="bar"   matches silences with foo=bar AND foo!=bar (both have value "bar")
 *  - foo=~"b.*"  matches silences where the foo value matches the regex "b.*"
 *  - foo!~"b.*"  matches silences where the foo value does NOT match "b.*"
 *  - foo!="bar"  matches silences where the foo value is NOT "bar"
 */
export function matchesSilenceMatcher(filter: Matcher, silenceMatcher: Matcher): boolean {
  if (filter.name !== silenceMatcher.name) {
    return false;
  }

  if (filter.isRegex) {
    try {
      const re = new RegExp(`^(?:${filter.value})$`);
      const valueMatches = re.test(silenceMatcher.value);
      return filter.isEqual !== false ? valueMatches : !valueMatches;
    } catch {
      return false;
    }
  }

  const valueEquals = filter.value === silenceMatcher.value;
  return filter.isEqual !== false ? valueEquals : !valueEquals;
}
