import { PromRuleDTO, PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { fuzzyMatches } from './fuzzySearch';
import { labelsMatchMatchers, looseParseMatcher } from '../../../../utils/labels';

interface GroupFilterOptions {
  namespace?: string;
  groupName?: string;
}

/**
 * @returns True if the group matches the filter, false otherwise. Keeps rules intact
 */
export function groupFilter(group: PromRuleGroupDTO, filterState: GroupFilterOptions): boolean {
  const { name, file } = group;
  const { namespace, groupName } = filterState;

  if (namespace && !fuzzyMatches(file, namespace)) {
    return false;
  }

  if (groupName && !fuzzyMatches(name, groupName)) {
    return false;
  }

  return true;
}

interface RuleFilterOptions {
  ruleName?: string;
  ruleState?: string;
  ruleType?: string;
  labels?: string[];
}

/**
 * @returns True if the rule matches the filter, false otherwise
 */
export function ruleFilter(rule: PromRuleDTO, filterState: RuleFilterOptions): boolean {
  const { name, labels = {}, type } = rule;
  const { ruleName, ruleState, ruleType, labels: labelFilters = [] } = filterState;

  // Filter by rule name
  if (ruleName && !fuzzyMatches(name, ruleName)) {
    return false;
  }

  // Filter by rule type
  if (ruleType && type !== ruleType) {
    return false;
  }

  // Filter by rule state (only applicable to alerting rules)
  if (ruleState) {
    if (rule.type !== 'alerting') {
      return false;
    }
    // Normalize state comparisons (inactive = normal)
    const normalizedRuleState = rule.state === 'inactive' ? 'normal' : rule.state;
    const normalizedFilterState = ruleState === 'inactive' ? 'normal' : ruleState;
    if (normalizedRuleState !== normalizedFilterState) {
      return false;
    }
  }

  // Filter by labels
  if (labelFilters.length > 0) {
    const matchers = labelFilters.map(looseParseMatcher).filter((m): m is NonNullable<typeof m> => m !== undefined);

    if (matchers.length > 0) {
      const doRuleLabelsMatchQuery = labelsMatchMatchers(labels, matchers);

      // Also check alerts if they exist (for alerting rules)
      let doAlertsContainMatchingLabels = false;
      if (rule.type === 'alerting' && rule.alerts) {
        doAlertsContainMatchingLabels = rule.alerts.some((alert) => labelsMatchMatchers(alert.labels || {}, matchers));
      }

      if (!doRuleLabelsMatchQuery && !doAlertsContainMatchingLabels) {
        return false;
      }
    }
  }

  return true;
}
