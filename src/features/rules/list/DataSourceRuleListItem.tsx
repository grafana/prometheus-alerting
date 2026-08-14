import React from 'react';

import { RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { getRuleName, isAlertingRule, isRecordingRule } from '@grafana/external-rules/utils';
import type { RulesSourceApplication } from '@grafana/external-rules/ruler';

import { DataSourceRuleGroupIdentifier, Rule } from '../../../types/rules';
import { fromRuleAndGroup, fromRulerRuleAndGroup } from '../../../utils/rule-id';
import { rules as rulesNav } from '../../../utils/navigation';

import {
  AlertRuleListItem,
  RecordingRuleListItem,
  RuleListItemCommonProps,
  UnknownRuleListItem,
} from './components/AlertRuleListItem';

export interface DataSourceRuleListItemProps {
  rule: Rule;
  rulerRule?: RulerRuleDTO;
  groupIdentifier: DataSourceRuleGroupIdentifier;
  application?: RulesSourceApplication;
  actions?: React.ReactNode;
  showLocation?: boolean;
}

export function DataSourceRuleListItem({
  rule,
  rulerRule,
  groupIdentifier,
  application,
  actions,
  showLocation = true,
}: DataSourceRuleListItemProps) {
  const { rulesSource, namespace, groupName } = groupIdentifier;

  const ruleName = getRuleName(rule);
  const labels = rule.labels;

  // Create rule identifier based on whether we have ruler rule data
  // If ruler rule is available, use Cloud Rule Identifier (cri) for editable rules
  // Otherwise use Prometheus Rule Identifier (pri) for read-only rules
  const ruleIdentifier = rulerRule
    ? fromRulerRuleAndGroup(rulerRule, groupIdentifier)
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
