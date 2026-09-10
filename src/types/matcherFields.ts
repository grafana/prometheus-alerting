/**
 * Shared form representation for Alertmanager matcher rows.
 *
 * Matcher values are feature-specific: routes use semantic values, while
 * inhibition forms keep editable lexical matcher tokens. The row shape stays
 * neutral so neither domain model depends on the React editor.
 */
export const matcherOperators = {
  equals: '=',
  notEquals: '!=',
  matchesRegex: '=~',
  doesNotMatchRegex: '!~',
} as const;

export type MatcherOperator = (typeof matcherOperators)[keyof typeof matcherOperators];

export interface MatcherFieldValue {
  name: string;
  value: string;
  operator: MatcherOperator;
}

export const emptyMatcherFieldValue: MatcherFieldValue = {
  name: '',
  value: '',
  operator: matcherOperators.equals,
};
