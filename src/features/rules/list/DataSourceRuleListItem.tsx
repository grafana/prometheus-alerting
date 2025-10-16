import React from 'react';

import { DataSourceRuleGroupIdentifier, Rule, RulesSourceApplication } from '../../../types/rules';
import { getRuleName, isAlertingRule, isRecordingRule } from '../../../utils/rules';
import { fromRuleAndGroup, fromRulerRuleAndGroup, RulerRuleDTO } from '../../../utils/rule-id';
import { rules as rulesNav } from '../../../utils/navigation';

import {
  AlertRuleListItem,
  RecordingRuleListItem,
  RuleListItemCommonProps,
  UnknownRuleListItem,
} from './components/AlertRuleListItem';

export interface DataSourceRuleListItemProps {
  rule: Rule;
  groupIdentifier: DataSourceRuleGroupIdentifier;
  application?: RulesSourceApplication;
  rulerApiEnabled?: boolean;
  actions?: React.ReactNode;
  showLocation?: boolean;
}

export function DataSourceRuleListItem({
  rule,
  groupIdentifier,
  application,
  rulerApiEnabled = false,
  actions,
  showLocation = true,
}: DataSourceRuleListItemProps) {
  const { rulesSource, namespace, groupName } = groupIdentifier;

  const ruleName = getRuleName(rule);
  const labels = rule.labels;

  // Create rule identifier based on Ruler API support
  // If Ruler API is enabled, use Cloud Rule Identifier (cri) for editable rules
  // Otherwise use Prometheus Rule Identifier (pri) for read-only rules
  const ruleIdentifier = rulerApiEnabled
    ? fromRulerRuleAndGroup(rule as unknown as RulerRuleDTO, groupIdentifier)
    : fromRuleAndGroup(rule, groupIdentifier);

  const ruleDetailsHref = rulesNav.detailsPageLink(ruleIdentifier);

  const commonProps: RuleListItemCommonProps = {
    name: ruleName,
    rulesSource: rulesSource,
    application: application,
    group: groupName,
    namespace: namespace.name,
    health: rule.health,
    error: rule.lastError,
    labels,
    showLocation,
    actions,
    href: ruleDetailsHref,
  };

  if (isAlertingRule(rule)) {
    const annotations = rule.annotations ?? {};
    const summary = annotations['summary'];

    return (
      <AlertRuleListItem {...commonProps} summary={summary} state={rule.state} instancesCount={rule.alerts?.length} />
    );
  }

  if (isRecordingRule(rule)) {
    return <RecordingRuleListItem {...commonProps} />;
  }

  return <UnknownRuleListItem ruleName={ruleName} ruleDefinition={rule} />;
}
