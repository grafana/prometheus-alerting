import React from 'react';

import { t } from '@grafana/i18n';
import { Badge, Stack, Text } from '@grafana/ui';
import type { AlertStatus, GettableAlert } from '@grafana/external-alertmanager/vanilla';

const STATE_BADGE_COLOR: Record<AlertStatus['state'], 'green' | 'orange' | 'blue'> = {
  active: 'green',
  unprocessed: 'orange',
  suppressed: 'blue',
};

interface AlertStateBadgeProps {
  alert: GettableAlert;
}

export function AlertStateBadge({ alert }: AlertStateBadgeProps) {
  const { state, silencedBy, inhibitedBy, mutedBy } = alert.status;

  return (
    <Stack direction="column" gap={0.5} alignItems="flex-start">
      <Badge text={state} color={STATE_BADGE_COLOR[state]} />
      {silencedBy.length > 0 && (
        <Text variant="bodySmall" color="secondary">
          {t('alerts.state.silenced-by', 'Silenced by {{count}} silence', { count: silencedBy.length })}
        </Text>
      )}
      {inhibitedBy.length > 0 && (
        <Text variant="bodySmall" color="secondary">
          {t('alerts.state.inhibited-by', 'Inhibited by {{count}} inhibition', { count: inhibitedBy.length })}
        </Text>
      )}
      {mutedBy.length > 0 && (
        <Text variant="bodySmall" color="secondary">
          {t('alerts.state.muted-by', 'Muted by {{count}} time interval', { count: mutedBy.length })}
        </Text>
      )}
    </Stack>
  );
}
