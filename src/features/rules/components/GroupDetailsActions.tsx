import React from 'react';

import { Trans } from '@grafana/i18n';
import { LinkButton, Stack } from '@grafana/ui';

import { AlertingAction, isAbilityAllowed, useScopedAbilities } from '../../../access-control/abilities';

interface GroupDetailsActionsProps {
  editLink: string;
  dataSourceUid: string;
}

export function GroupDetailsActions({ editLink, dataSourceUid }: GroupDetailsActionsProps) {
  const updateAbility = useScopedAbilities(dataSourceUid)[AlertingAction.UpdateRule];

  if (!isAbilityAllowed(updateAbility)) {
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
