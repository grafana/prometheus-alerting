/**
 * Alerting rules can use Go templates (things like `{{ $labels.instance }}`) in label and
 * annotation values. Mimir parses those templates and rejects the rule if they don't parse, and
 * the most common way that happens is a `{{` that's never closed, or a stray `}}` with nothing to
 * match it. This isn't a full template parser -- Mimir's real one will still catch anything
 * subtler -- it just counts delimiters so we can flag the common typo before the save round trip.
 */
export function hasUnbalancedTemplateDelimiters(value: string): boolean {
  const opens = value.match(/\{\{/g)?.length ?? 0;
  const closes = value.match(/\}\}/g)?.length ?? 0;

  return opens !== closes;
}
