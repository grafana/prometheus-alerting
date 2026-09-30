import React from 'react';

import { Trans } from '@grafana/i18n';
import { LinkButton, Stack } from '@grafana/ui';

import type { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';
import { isFederatedRulerGroup } from '@grafana/external-rules/utils';

import { AlertingAction, isAbilityAllowed, useScopedAbilities } from '../../../access-control/abilities';

interface GroupDetailsActionsProps {
  editLink: string;
  dataSourceUid: string;
  /** Undefined when the data source has no Ruler API, in which case there is nothing to edit. */
  rulerGroup?: RulerRuleGroupDTO;
}

export function GroupDetailsActions({ editLink, dataSourceUid, rulerGroup }: GroupDetailsActionsProps) {
  const updateAbility = useScopedAbilities(dataSourceUid)[AlertingAction.UpdateRule];
  // The edit form has no field for source_tenants, so a federated group is not ours to edit
  const isFederated = rulerGroup ? isFederatedRulerGroup(rulerGroup) : false;

  if (!isAbilityAllowed(updateAbility) || isFederated) {
    return null;
  }

  return (
    <Stack direction="row" gap={1}>
      <LinkButton href={editLink} icon="pen" variant="secondary">
        <Trans i18nKey="alerting.group-details.actions.edit">Edit</Trans>
      </LinkButton>
    </Stack>
  );
}
