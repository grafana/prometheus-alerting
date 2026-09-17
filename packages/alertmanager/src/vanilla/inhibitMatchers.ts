import { type InhibitRule } from './api/types/common';
import { parseObjectMatcherExpression, type ObjectMatcher } from './matchers.utils';

/**
 * An inhibit rule with deprecated matcher maps folded into semantic matcher tuples.
 * Deprecated maps are already semantic values, so they bypass textual parsing.
 */
export type NormalizedInhibitRule = Omit<
  InhibitRule,
  'source_matchers' | 'target_matchers' | 'source_match' | 'source_match_re' | 'target_match' | 'target_match_re'
> & {
  source_matchers: ObjectMatcher[];
  target_matchers: ObjectMatcher[];
};

/**
 * Normalizes current textual matcher arrays and deprecated semantic maps.
 * Keep this order: current syntax, deprecated regex map, deprecated equality map.
 */
export function normalizeInhibitRuleMatchers(inhibitRule: InhibitRule): NormalizedInhibitRule {
  const sourceMatchers = normalizeMatcherSources(
    inhibitRule.source_matchers,
    inhibitRule.source_match_re,
    inhibitRule.source_match
  );
  const targetMatchers = normalizeMatcherSources(
    inhibitRule.target_matchers,
    inhibitRule.target_match_re,
    inhibitRule.target_match
  );

  const { source_match, source_match_re, target_match, target_match_re, ...ruleWithoutDeprecatedMatchers } =
    inhibitRule;

  return {
    ...ruleWithoutDeprecatedMatchers,
    source_matchers: sourceMatchers,
    target_matchers: targetMatchers,
  };
}

function normalizeMatcherSources(
  currentMatchers: string[] | undefined,
  deprecatedRegexMatchers: Record<string, string> | undefined,
  deprecatedEqualityMatchers: Record<string, string> | undefined
): ObjectMatcher[] {
  return [
    ...(currentMatchers ?? []).flatMap(parseObjectMatcherExpression),
    ...Object.entries(deprecatedRegexMatchers ?? {}).map(([name, value]): ObjectMatcher => [name, '=~', value]),
    ...Object.entries(deprecatedEqualityMatchers ?? {}).map(([name, value]): ObjectMatcher => [name, '=', value]),
  ];
}
