import React, { useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { InteractiveTable, Alert } from '@grafana/ui';
import { type Receiver, getReceiverTypes } from '@grafana/external-alertmanager/vanilla';

import { useReceivers } from '../../hooks/useReceivers';
import { AlertmanagerPage } from '../../components/AlertmanagerPage';

import { Trans, t } from '@grafana/i18n';

function ReceiversPage() {
  const [triggerFetch, { receivers = [], isLoading, error }] = useReceivers();

  useEffect(() => {
    triggerFetch()
  }, [triggerFetch]);

  const getTotalConfigs = (receiver: Receiver): number => {
    let total = 0;
    if (receiver.email_configs) {
      total += receiver.email_configs.length;
    }
    if (receiver.slack_configs) {
      total += receiver.slack_configs.length;
    }
    if (receiver.pagerduty_configs) {
      total += receiver.pagerduty_configs.length;
    }
    if (receiver.webhook_configs) {
      total += receiver.webhook_configs.length;
    }
    if (receiver.opsgenie_configs) {
      total += receiver.opsgenie_configs.length;
    }
    if (receiver.wechat_configs) {
      total += receiver.wechat_configs.length;
    }
    if (receiver.pushover_configs) {
      total += receiver.pushover_configs.length;
    }
    if (receiver.victorops_configs) {
      total += receiver.victorops_configs.length;
    }
    if (receiver.sns_configs) {
      total += receiver.sns_configs.length;
    }
    if (receiver.telegram_configs) {
      total += receiver.telegram_configs.length;
    }
    if (receiver.discord_configs) {
      total += receiver.discord_configs.length;
    }
    if (receiver.webex_configs) {
      total += receiver.webex_configs.length;
    }
    if (receiver.msteams_configs) {
      total += receiver.msteams_configs.length;
    }
    return total;
  };

  const columns = [
    {
      id: 'name',
      header: t('receivers.column.name', 'Name'),
      cell: ({ row: { original } }: { row: { original: Receiver } }) => original.name,
    },
    {
      id: 'types',
      header: t('receivers.column.types', 'Types'),
      cell: ({ row: { original } }: { row: { original: Receiver } }) => {
        const types = getReceiverTypes(original);
        return types.length > 0 ? types.join(', ') : t('receivers.none', 'None');
      },
    },
    {
      id: 'integrations',
      header: t('receivers.column.integrations', 'Integrations'),
      cell: ({ row: { original } }: { row: { original: Receiver } }) => getTotalConfigs(original),
    },
  ];

  return (
    <AlertmanagerPage>
      <div data-testid={testIds.receivers.container}>
        {isLoading && (
          <Skeleton height={24} count={5} />
        )}
        {error && (
          <Alert title={t('receivers.error-loading-title', 'Error loading receivers')} severity="error">
            {'error' in error ? error.error : t('receivers.error-loading-message', 'Failed to fetch receivers')}
          </Alert>
        )}
        {!isLoading && receivers.length > 0 && (
          <InteractiveTable columns={columns} data={receivers} getRowId={(receiver) => receiver.name} />
        )}
        {!isLoading && receivers.length === 0 && !error && (
          <Alert title={t('receivers.no-receivers-title', 'No receivers found')} severity="info">
            <Trans i18nKey="receivers.no-receivers-message">No receivers are configured in the Alertmanager.</Trans>
          </Alert>
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default ReceiversPage;
