import { PromRuleDTO, PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { fuzzyMatches } from '../../../../utils/fuzzySearch';

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
}

/**
 * @returns True if the rule matches the filter, false otherwise
 */
export function ruleFilter(rule: PromRuleDTO, filterState: RuleFilterOptions): boolean {
  const { name } = rule;
  const { ruleName } = filterState;

  if (ruleName && !fuzzyMatches(name, ruleName)) {
    return false;
  }

  return true;
}
