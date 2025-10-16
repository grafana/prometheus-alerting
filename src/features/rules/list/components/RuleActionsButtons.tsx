import React from 'react';

import { Trans } from '@grafana/i18n';
import { LinkButton, Stack } from '@grafana/ui';

import { PromRuleDTO } from '@grafana/external-rules/vanilla';

import { DataSourceRuleGroupIdentifier } from '../../../../types/rules';
import {
  DataSourceRuleIdentifier,
  fromRuleAndGroup,
  fromRulerRuleAndGroup,
  RulerRuleDTO,
} from '../../../../utils/rule-id';
import { rules as rulesNav } from '../../../../utils/navigation';

import { RuleActionsMenu } from './RuleActionsMenu';

interface Props {
  rule: PromRuleDTO;
  groupIdentifier: DataSourceRuleGroupIdentifier;
  rulerApiEnabled: boolean;
  onDelete: (identifier: DataSourceRuleIdentifier) => void;
  onDuplicate: (identifier: DataSourceRuleIdentifier) => void;
  compact?: boolean;
}

export function RuleActionsButtons({
  rule,
  groupIdentifier,
  rulerApiEnabled,
  onDelete,
  onDuplicate,
  compact = false,
}: Props) {
  // Use Cloud Rule Identifier (cri) if Ruler API is enabled, otherwise Prometheus Rule Identifier (pri)
  const identifier = rulerApiEnabled
    ? fromRulerRuleAndGroup(rule as unknown as RulerRuleDTO, groupIdentifier)
    : fromRuleAndGroup(rule, groupIdentifier);

  const buttonSize = compact ? 'sm' : 'md';

  // If ruler API is enabled, show Edit button + More menu
  if (rulerApiEnabled) {
    const editUrl = rulesNav.editPageLink(identifier);

    return (
      <Stack gap={0} alignItems="center" wrap="nowrap">
        <LinkButton size={buttonSize} variant="secondary" fill="text" href={editUrl}>
          <Trans i18nKey="alerting.rule-actions.edit">Edit</Trans>
        </LinkButton>
        <RuleActionsMenu
          rule={rule}
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
      groupIdentifier={groupIdentifier}
      rulerApiEnabled={rulerApiEnabled}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      buttonSize={buttonSize}
      fill="text"
    />
  );
}
