import React from 'react';

import { t } from '@grafana/i18n';
import { LinkButton, Stack, Text } from '@grafana/ui';

import { PLUGIN_BASE_URL, ROUTES } from '../../../constants';

import { FederatedGroupBadge } from './FederatedGroupBadge';

interface GroupDetailsTitleProps {
  name: string;
  /** Set when the group reads data from other tenants, which gets it a badge. */
  sourceTenants?: string[];
}

export function GroupDetailsTitle({ name, sourceTenants }: GroupDetailsTitleProps) {
  const returnTo = `${PLUGIN_BASE_URL}/${ROUTES.Rules}`;

  return (
    <Stack direction="row" gap={1} minWidth={0} alignItems="center">
      <LinkButton
        aria-label={t('alerting.group-details.title.back', 'Back to rules list')}
        variant="secondary"
        icon="angle-left"
        href={returnTo}
      />
      <Text element="h1" truncate>
        {name}
      </Text>
      {sourceTenants && <FederatedGroupBadge sourceTenants={sourceTenants} />}
    </Stack>
  );
}
