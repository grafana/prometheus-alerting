import type { PromRuleDTO, PromRuleGroupDTO, RulerRuleDTO, RulerRuleGroupDTO } from './vanilla/api';
import { getRuleName } from './utils/rule';
import { getPromRuleFingerprint, getRulerRuleFingerprint } from './hashing/fingerprint';
import { CloudRuleIdentifier, PrometheusRuleIdentifier } from './identifiers';
import { hashRule, hashRulerRule } from './hashing';

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

/**
 * Matches a Ruler rule with its corresponding Prometheus rule (inverse of getMatchingRulerRule).
 * Used when Ruler API is the source of truth.
 *
 * Matching logic:
 * 1. First tries to match by unique rule name
 * 2. If multiple rules have the same name, compares labels and annotations
 * 3. As a last resort, compares including the query expression
 *
 * @param promRules - Array of prometheus rules from the Prometheus API
 * @param rulerRule - The ruler rule to find a match for
 * @returns The matching PromRuleDTO or undefined if no match is found
 */
export function getMatchingPromRule(promRules: PromRuleDTO[], rulerRule: RulerRuleDTO): PromRuleDTO | undefined {
  const rulerRuleName = getRuleName(rulerRule);

  // If all rule names are unique, we can use the rule name to find the rule
  const rulesByName = promRules.filter((r) => getRuleName(r) === rulerRuleName);
  if (rulesByName.length === 1) {
    return rulesByName[0];
  }

  if (rulesByName.length === 0) {
    return undefined;
  }

  // If we don't have a unique rule name, try to compare by labels and annotations
  const rulesByLabelsAndAnnotations = rulesByName.filter((r) => {
    return getPromRuleFingerprint(r, false).join('-') === getRulerRuleFingerprint(rulerRule, false).join('-');
  });

  if (rulesByLabelsAndAnnotations.length === 1) {
    return rulesByLabelsAndAnnotations[0];
  }

  // As a last resort, compare including the query
  const rulesByLabelsAndAnnotationsAndQuery = rulesByName.filter((r) => {
    return getPromRuleFingerprint(r, true).join('-') === getRulerRuleFingerprint(rulerRule, true).join('-');
  });

  if (rulesByLabelsAndAnnotationsAndQuery.length === 1) {
    return rulesByLabelsAndAnnotationsAndQuery[0];
  }

  return undefined;
}

export function matchRulerRuleById(group: RulerRuleGroupDTO, ruleIdentifier: CloudRuleIdentifier) {
  const { groupName, ruleName, rulerRuleHash } = ruleIdentifier;

  if (group.name !== groupName) {
    return undefined;
  }

  const matchingByName = group.rules.filter((r) => getRuleName(r) === ruleName);

  if (matchingByName.length === 1) {
    return matchingByName[0];
  }

  return matchingByName.find((r) => hashRulerRule(r) === rulerRuleHash);
}

export function matchPromRuleById(group: PromRuleGroupDTO, ruleIdentifier: PrometheusRuleIdentifier) {
  const { groupName, ruleName, ruleHash } = ruleIdentifier;

  if (group.name !== groupName) {
    return undefined;
  }

  const matchingByName = group.rules.filter((r) => getRuleName(r) === ruleName);

  if (matchingByName.length === 1) {
    return matchingByName[0];
  }

  return matchingByName.find((r) => hashRule(r) === ruleHash);
}
