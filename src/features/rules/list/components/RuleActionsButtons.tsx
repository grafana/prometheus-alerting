import React from 'react';

import { Trans } from '@grafana/i18n';
import { LinkButton, Stack } from '@grafana/ui';

import { PromRuleDTO, RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';

import { DataSourceRuleGroupIdentifier } from '../../../../types/rules';
import { fromRuleAndGroup, fromRulerRuleAndGroup } from '../../../../utils/rule-id';
import { rules as rulesNav } from '../../../../utils/navigation';

import { RuleActionsMenu } from './RuleActionsMenu';

interface Props {
  rule?: RulerRuleDTO; // The editable rule from Ruler API (undefined if Ruler API not supported)
  promRule: PromRuleDTO; // The read-only rule from Prometheus API
  groupIdentifier: DataSourceRuleGroupIdentifier;
  rulerApiEnabled: boolean;
  onDelete: (identifier: DataSourceRuleIdentifier) => void;
  onDuplicate: (identifier: DataSourceRuleIdentifier) => void;
  compact?: boolean;
}

export function RuleActionsButtons({
  rule,
  promRule,
  groupIdentifier,
  rulerApiEnabled,
  onDelete,
  onDuplicate,
  compact = false,
}: Props) {
  // Use Cloud Rule Identifier (cri) if we have a ruler rule, otherwise Prometheus Rule Identifier (pri)
  const identifier = rule ? fromRulerRuleAndGroup(rule, groupIdentifier) : fromRuleAndGroup(promRule, groupIdentifier);

  const buttonSize = compact ? 'sm' : 'md';

  // If ruler API is enabled and we have a ruler rule, show Edit button + More menu
  if (rulerApiEnabled && rule) {
    const editUrl = rulesNav.editPageLink(identifier);

    return (
      <Stack gap={0} alignItems="center" wrap="nowrap">
        <LinkButton size={buttonSize} variant="secondary" fill="text" href={editUrl}>
          <Trans i18nKey="alerting.rule-actions.edit">Edit</Trans>
        </LinkButton>
        <RuleActionsMenu
          rule={rule}
          promRule={promRule}
          groupIdentifier={groupIdentifier}
          rulerApiEnabled={rulerApiEnabled}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          buttonSize={buttonSize}
          fill="text"
        />
      </Stack>
    );
  }

  // Read-only mode: just show More menu with Copy link
  return (
    <RuleActionsMenu
      rule={rule}
      promRule={promRule}
      groupIdentifier={groupIdentifier}
      rulerApiEnabled={rulerApiEnabled}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      buttonSize={buttonSize}
      fill="text"
    />
  );
}
