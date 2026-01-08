import React from 'react';
import { AlertmanagerStatus } from '@grafana/external-alertmanager/vanilla';
import { Badge } from '@grafana/ui';
import { t } from '@grafana/i18n';

type Props = {
  status: AlertmanagerStatus['cluster']['status'];
};

export function ClusterStatus({ status }: Props) {
  if (status === 'disabled') {
    return <Badge color="red" text={t('cluster-status.disabled', 'Disabled')} />;
  }

  if (status === 'ready') {
    return <Badge color="green" text={t('cluster-status.ready', 'Ready')} />;
  }

  if (status === 'settling') {
    return <Badge color="orange" text={t('cluster-status.settling', 'Settling')} />;
  }

  return <Badge color="darkgrey" text={t('cluster-status.unknown', 'Unknown')} />;
}
