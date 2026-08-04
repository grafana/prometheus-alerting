import React from 'react';

import { Trans } from '@grafana/i18n';
import { LinkButton, Stack } from '@grafana/ui';

import { PromRuleDTO, RulerRuleDTO } from '@grafana/external-rules/vanilla';
import { CloudRuleIdentifier, DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';

import { DataSourceRuleGroupIdentifier } from '../../../../types/rules';
import { fromRuleAndGroup, fromRulerRuleAndGroup } from '../../../../utils/rule-id';
import { rules as rulesNav } from '../../../../utils/navigation';
import { AlertingAction, isAbilityAllowed, useScopedAbilities } from '../../../../access-control/abilities';

import { RuleActionsMenu } from './RuleActionsMenu';

interface Props {
  rule?: RulerRuleDTO; // The editable rule from Ruler API (undefined if Ruler API not supported)
  promRule: PromRuleDTO; // The read-only rule from Prometheus API
  groupIdentifier: DataSourceRuleGroupIdentifier;
  /** Deleting requires the Ruler API, so it always works on a Cloud (ruler) identifier */
  onDelete: (identifier: CloudRuleIdentifier) => void;
  onDuplicate: (identifier: DataSourceRuleIdentifier) => void;
  onSilence?: (identifier: DataSourceRuleIdentifier, ruleName: string) => void;
  onExport?: (rule: RulerRuleDTO) => void;
  compact?: boolean;
}

export function RuleActionsButtons({
  rule,
  promRule,
  groupIdentifier,
  onDelete,
  onDuplicate,
  onSilence,
  onExport,
  compact = false,
}: Props) {
  // Use Cloud Rule Identifier (cri) if we have a ruler rule, otherwise Prometheus Rule Identifier (pri)
  const identifier = rule ? fromRulerRuleAndGroup(rule, groupIdentifier) : fromRuleAndGroup(promRule, groupIdentifier);
  const scopedAbilities = useScopedAbilities(identifier.uid);
  const canUpdateRules = isAbilityAllowed(scopedAbilities[AlertingAction.UpdateRule]);

  const buttonSize = compact ? 'sm' : 'md';

  // If we have a ruler rule and updating is allowed, show Edit button + More menu
  if (rule && canUpdateRules) {
    const editUrl = rulesNav.editPageLink(identifier);

    return (
      <Stack gap={1} alignItems="center" wrap="nowrap">
        <LinkButton size={buttonSize} variant="secondary" icon="pen" href={editUrl}>
          <Trans i18nKey="alerting.rule-actions.edit">Edit</Trans>
        </LinkButton>
        <RuleActionsMenu
          rule={rule}
          promRule={promRule}
          groupIdentifier={groupIdentifier}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onSilence={onSilence}
          onExport={onExport}
          buttonSize={buttonSize}
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
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onSilence={onSilence}
      onExport={onExport}
      buttonSize={buttonSize}
    />
  );
}
