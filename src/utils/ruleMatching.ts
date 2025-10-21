import { PromRuleDTO, RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { getRuleName } from '@grafana/external-rules/utils';
import { getPromRuleFingerprint, getRulerRuleFingerprint } from '@grafana/external-rules/hashing';

/**
 * Matches a Prometheus rule with its corresponding Ruler rule definition in a rule group.
 *
 * Matching logic:
 * 1. First tries to match by unique rule name
 * 2. If multiple rules have the same name, compares labels and annotations
 * 3. As a last resort, compares including the query expression
 *
 * @param rulerRules - Array of ruler rules from the Ruler API
 * @param promRule - The prometheus rule to find a match for
 * @returns The matching RulerRuleDTO or undefined if no match is found
 */
export function getMatchingRulerRule(rulerRules: RulerRuleDTO[], promRule: PromRuleDTO): RulerRuleDTO | undefined {
  const promRuleName = getRuleName(promRule);

  // If all rule names are unique, we can use the rule name to find the rule. We don't need to hash the rule
  const rulesByName = rulerRules.filter((r) => getRuleName(r) === promRuleName);
  if (rulesByName.length === 1) {
    return rulesByName[0];
  }

  if (rulesByName.length === 0) {
    return undefined;
  }

  // If we don't have a unique rule name, try to compare by labels and annotations
  const rulesByLabelsAndAnnotations = rulesByName.filter((r) => {
    return getRulerRuleFingerprint(r, false).join('-') === getPromRuleFingerprint(promRule, false).join('-');
  });

  if (rulesByLabelsAndAnnotations.length === 1) {
    return rulesByLabelsAndAnnotations[0];
  }

  // As a last resort, compare including the query
  const rulesByLabelsAndAnnotationsAndQuery = rulesByName.filter((r) => {
    return getRulerRuleFingerprint(r, true).join('-') === getPromRuleFingerprint(promRule, true).join('-');
  });

  if (rulesByLabelsAndAnnotationsAndQuery.length === 1) {
    return rulesByLabelsAndAnnotationsAndQuery[0];
  }

  return undefined;
}
