import type { LabelMatcher } from '@grafana/alerting';
import { isLabelMatch, matchLabelsSet } from '@grafana/alerting/unstable';
import type { GettableAlert, GettableSilence, Matcher } from '@grafana/external-alertmanager/vanilla';

/** Turn an Alertmanager matcher into the shape @grafana/alerting matches with. A missing `isEqual` means equal. */
export function toLabelMatcher({ name, value, isRegex, isEqual = true }: Matcher): LabelMatcher {
  if (isRegex) {
    return { label: name, type: isEqual ? '=~' : '!~', value };
  }
  return { label: name, type: isEqual ? '=' : '!=', value };
}

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
  try {
    return isLabelMatch(toLabelMatcher(filter), [silenceMatcher.name, silenceMatcher.value]);
  } catch {
    // isLabelMatch throws on a regex that doesn't compile, which a half-typed filter often is.
    return false;
  }
}

/**
 * Checks if an alert matches a silence based on the silence's matchers.
 * This is used to filter alerts client-side when the API doesn't support
 * filtering by specific silence ID.
 */
export function alertMatchesSilence(alert: GettableAlert, silence: GettableSilence): boolean {
  if (alert.status.silencedBy?.includes(silence.id)) {
    return true;
  }

  return matchLabelsSet(silence.matchers.map(toLabelMatcher), Object.entries(alert.labels));
}
