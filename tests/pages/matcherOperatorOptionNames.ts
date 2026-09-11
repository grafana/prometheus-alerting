import type { MatcherOperator } from '../../src/types/matcherFields';

/** Accessible names rendered by the matcher operator Combobox options. */
export const matcherOperatorOptionNames: Record<MatcherOperator, string> = {
  '=': '= Equals',
  '!=': '!= Does not equal',
  '=~': '=~ Matches regular expression',
  '!~': '!~ Does not match regular expression',
};
