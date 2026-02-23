import React from 'react';

import { t } from '@grafana/i18n';
import { Badge, Stack } from '@grafana/ui';
import type { AlertStatus, GettableAlert } from '@grafana/external-alertmanager/vanilla';

import { countAlertsByState } from '../utils/alerts.utils';

const STATE_BADGE_COLOR: Record<AlertStatus['state'], 'green' | 'orange' | 'blue'> = {
  active: 'green',
  unprocessed: 'orange',
  suppressed: 'blue',
};

interface AlertStateCountsProps {
  alerts: GettableAlert[];
}

export function AlertStateCounts({ alerts }: AlertStateCountsProps) {
  const counts = countAlertsByState(alerts);

  return (
    <Stack direction="row" gap={0.5}>
      {counts.active > 0 && (
        <Badge color={STATE_BADGE_COLOR['active']} text={t('alerts.count.active', '{{n}} active', { n: counts.active })} />
      )}
      {counts.unprocessed > 0 && (
        <Badge color={STATE_BADGE_COLOR['unprocessed']} text={t('alerts.count.unprocessed', '{{n}} unprocessed', { n: counts.unprocessed })} />
      )}
      {counts.suppressed > 0 && (
        <Badge color={STATE_BADGE_COLOR['suppressed']} text={t('alerts.count.suppressed', '{{n}} suppressed', { n: counts.suppressed })} />
      )}
    </Stack>
  );
}
