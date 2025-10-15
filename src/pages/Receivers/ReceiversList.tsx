import React, { useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { InteractiveTable, Alert } from '@grafana/ui';
import { type Receiver, getReceiverTypes } from '@grafana/external-alertmanager/vanilla';

import { useReceivers } from '../../hooks/useReceivers';
import { AlertmanagerPage } from '../../components/AlertmanagerPage';
import { getTotalReceiverConfigs } from './receiversUtils';

import { Trans, t } from '@grafana/i18n';

function ReceiversPage() {
  const [triggerFetch, { receivers = [], isLoading, error }] = useReceivers();

  useEffect(() => {
    triggerFetch()
  }, [triggerFetch]);

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
      cell: ({ row: { original } }: { row: { original: Receiver } }) => getTotalReceiverConfigs(original),
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
