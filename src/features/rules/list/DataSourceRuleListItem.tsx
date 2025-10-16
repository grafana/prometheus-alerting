import React from 'react';

import { DataSourceRuleGroupIdentifier, Rule, RulesSourceApplication } from '../../../types/rules';
import { getRuleName, isAlertingRule, isRecordingRule } from '../../../utils/rules';

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
  actions?: React.ReactNode;
  showLocation?: boolean;
}

export function DataSourceRuleListItem({
  rule,
  groupIdentifier,
  application,
  actions,
  showLocation = true,
}: DataSourceRuleListItemProps) {
  const { rulesSource, namespace, groupName } = groupIdentifier;

  const ruleName = getRuleName(rule);
  const labels = rule.labels;

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
