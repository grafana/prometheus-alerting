import type { PromRuleDTO, PromRuleGroupDTO, RulerRuleDTO, RulerRuleGroupDTO } from './vanilla/api';
import { getRuleName } from './utils/rule';
import { getPromRuleFingerprint, getRulerRuleFingerprint } from './hashing/fingerprint';
import { CloudRuleIdentifier, PrometheusRuleIdentifier } from './identifiers';
import { hashRule, hashRulerRule } from './hashing';

/**
 * A rule's position within its group, encoded as `"<index>:<totalRules>"` (e.g. `"0:3"`).
 *
 * Used as a last-resort tiebreaker when two rules are otherwise indistinguishable (identical
 * name, labels, annotations, and query): rules only match by position when both groups have the
 * same number of rules, so a structural difference between the two sides never produces a false
 * positive. Ported from the position-hash approach in grafana/grafana#112407.
 */
export type RulePositionHash = `${number}:${number}`;

export function createRulePositionHash(ruleIndex: number, totalRules: number): RulePositionHash {
  return `${ruleIndex}:${totalRules}`;
}

/**
 * Matches a Prometheus rule with its corresponding Ruler rule definition in a rule group.
 *
 * Matching logic:
 * 1. First tries to match by unique rule name
 * 2. If multiple rules have the same name, compares labels and annotations
 * 3. If still ambiguous, compares including the query expression
 * 4. As a last resort, if `promRulePositionHash` is given, disambiguates fully-identical rules by
 *    matching their position within the group
 *
 * @param rulerRules - Array of ruler rules from the Ruler API
 * @param promRule - The prometheus rule to find a match for
 * @param promRulePositionHash - Position of `promRule` within its own group (see {@link createRulePositionHash})
 * @returns The matching RulerRuleDTO or undefined if no match is found
 */
export function getMatchingRulerRule(
  rulerRules: RulerRuleDTO[],
  promRule: PromRuleDTO,
  promRulePositionHash?: RulePositionHash
): RulerRuleDTO | undefined {
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

  // If there are still multiple identical matches, use the position hash to disambiguate. This
  // only succeeds when both sides have the same number of rules in the same order.
  if (rulesByLabelsAndAnnotationsAndQuery.length > 1 && promRulePositionHash) {
    const match = rulesByLabelsAndAnnotationsAndQuery.find((r) => {
      const index = rulerRules.indexOf(r);
      return createRulePositionHash(index, rulerRules.length) === promRulePositionHash;
    });
    if (match) {
      return match;
    }
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
 * 3. If still ambiguous, compares including the query expression
 * 4. As a last resort, if `rulerRulePositionHash` is given, disambiguates fully-identical rules by
 *    matching their position within the group
 *
 * @param promRules - Array of prometheus rules from the Prometheus API
 * @param rulerRule - The ruler rule to find a match for
 * @param rulerRulePositionHash - Position of `rulerRule` within its own group (see {@link createRulePositionHash})
 * @returns The matching PromRuleDTO or undefined if no match is found
 */
export function getMatchingPromRule(
  promRules: PromRuleDTO[],
  rulerRule: RulerRuleDTO,
  rulerRulePositionHash?: RulePositionHash
): PromRuleDTO | undefined {
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

  // If there are still multiple identical matches, use the position hash to disambiguate. This
  // only succeeds when both sides have the same number of rules in the same order.
  if (rulesByLabelsAndAnnotationsAndQuery.length > 1 && rulerRulePositionHash) {
    const match = rulesByLabelsAndAnnotationsAndQuery.find((r) => {
      const index = promRules.indexOf(r);
      return createRulePositionHash(index, promRules.length) === rulerRulePositionHash;
    });
    if (match) {
      return match;
    }
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
