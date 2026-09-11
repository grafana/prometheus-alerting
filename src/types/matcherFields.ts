/**
 * Shared UI row shape for Alertmanager matcher editors.
 *
 * Syntax ownership is feature-specific: route rows preserve their legacy
 * textual matcher tokens, while inhibition rows contain semantic strings.
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
