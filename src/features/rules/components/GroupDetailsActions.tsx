import React from 'react';

import { Trans } from '@grafana/i18n';
import { LinkButton, Stack } from '@grafana/ui';

interface GroupDetailsActionsProps {
  editLink: string;
  canEdit: boolean;
}

export function GroupDetailsActions({ editLink, canEdit }: GroupDetailsActionsProps) {
  if (!canEdit) {
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
