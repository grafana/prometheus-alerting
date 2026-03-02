/**
 * Minimal filter shape — matches the subset of AdHocFilterWithLabels that we use.
 * AdHocFilterWithLabels is not exported from @grafana/scenes@7.0.3, so we define
 * the fields we actually need here.
 */
export interface SilenceFilter {
  key: string;
  operator: string;
  value: string;
  values?: string[];
  nonApplicable?: boolean;
  hidden?: boolean;
}

/**
 * Custom expression builder for Prometheus that properly handles regex operators.
 * Unlike the default builder, this doesn't escape regex metacharacters when using =~ or !~,
 * allowing users to enter raw regex patterns.
 *
 * Ported from grafana/grafana: public/app/features/alerting/unified/triage/scene/expressionBuilder.ts
 */
export function prometheusExpressionBuilder(filters: SilenceFilter[]): string {
  const applicableFilters = filters.filter((f) => !f.nonApplicable && !f.hidden);
  return applicableFilters.map(renderFilter).join(',');
}

// Map multi-value operators to their regex equivalents
const MULTI_VALUE_OPERATOR_MAP: Record<string, string> = {
  '=|': '=~',
  '!=|': '!~',
};

function renderFilter(filter: SilenceFilter): string {
  const { key, operator: rawOperator, value, values } = filter;
  const operator = MULTI_VALUE_OPERATOR_MAP[rawOperator] ?? rawOperator;
  const escapedValue = getEscapedValue(rawOperator, value, values);
  return `${key}${operator}"${escapedValue}"`;
}

function getEscapedValue(operator: string, value: string | undefined, values: string[] | undefined): string {
  if (operator === '=|' || operator === '!=|') {
    return values?.map(escapeAsLiteral).join('|') ?? '';
  }
  // Regex operators: preserve regex metacharacters
  return escapeStringLiteral(value);
}

/**
 * Escapes a value as a literal string (for use inside a regex alternation).
 * Escapes all regex metacharacters.
 */
function escapeAsLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escapes a value for use in PromQL string literals.
 * Only escapes backslashes, newlines, and double quotes.
 * Does NOT escape regex metacharacters (intentional — users write raw regex).
 */
function escapeStringLiteral(value: string | undefined): string {
  if (!value) {
    return '';
  }
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}
