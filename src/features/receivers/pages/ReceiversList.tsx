import React, { useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { InteractiveTable, Alert, EmptyState, TextLink } from '@grafana/ui';
import { type Receiver } from '@grafana/external-alertmanager/vanilla';

import { useReceivers } from '../hooks/useReceivers';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { getContactPointDescription } from '../utils/receiversUtils';
import { DEFAULT_PAGE_SIZE, ROUTES } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';

import { t } from '@grafana/i18n';

function ReceiversPage() {
  const [triggerFetch, { receivers = [], isLoading, error }] = useReceivers();

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const columns = [
    {
      id: 'name',
      header: t('receivers.column.name', 'Name'),
      cell: ({ row: { original } }: { row: { original: Receiver } }) => (
        <TextLink href={prefixRoute(`${ROUTES.Receivers}/${encodeURIComponent(original.name)}`)} inline={false}>
          {original.name}
        </TextLink>
      ),
    },
    {
      id: 'integrations',
      header: t('receivers.column.integrations', 'Integrations'),
      cell: ({ row: { original } }: { row: { original: Receiver } }) => getContactPointDescription(original),
    },
  ];

  return (
    <AlertmanagerPage>
      <div data-testid={testIds.receivers.container}>
        {isLoading && <Skeleton height={24} count={5} />}
        {error && (
          <Alert title={t('receivers.error-loading-title', 'Error loading receivers')} severity="error">
            {'error' in error ? error.error : t('receivers.error-loading-message', 'Failed to fetch receivers')}
          </Alert>
        )}
        {!isLoading && receivers.length > 0 && !error && (
          <InteractiveTable
            columns={columns}
            data={receivers}
            getRowId={(receiver) => receiver.name}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        )}
        {!isLoading && receivers.length === 0 && !error && (
          <EmptyState
            message={t('receivers.no-receivers-message', 'No receivers are configured in the Alertmanager.')}
            variant="call-to-action"
          />
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default ReceiversPage;
