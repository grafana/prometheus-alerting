import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { InteractiveTable, Alert, EmptyState, Icon, Stack, Tooltip } from '@grafana/ui';
import { type Receiver } from '@grafana/external-alertmanager/vanilla';

import { useReceivers } from '../hooks/useReceivers';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { getContactPointDescription, getReceiverIntegrations } from '../utils/receiversUtils';
import { getIntegrationIcon } from '../utils/integrationIcons';
import { ReceiverDrawer } from '../components/ReceiverDrawer';
import { DEFAULT_PAGE_SIZE } from '../../../constants';

import { t } from '@grafana/i18n';

function ReceiversPage() {
  const [triggerFetch, { receivers = [], isLoading, error }] = useReceivers();
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const clickableCellStyles = css({
    cursor: 'pointer',
  });

  const columns = [
    {
      id: 'name',
      header: t('receivers.column.name', 'Name'),
      cell: ({ row: { original } }: { row: { original: Receiver } }) => {
        const integrations = getReceiverIntegrations(original);
        return (
          <div className={clickableCellStyles} onClick={() => setSelectedReceiver(original)}>
            <Stack direction="row" gap={1} alignItems="center">
              {integrations.length > 0 && (
                <Stack direction="row" gap={0.5}>
                  {integrations.map((integration) => (
                    <Tooltip
                      key={integration.type}
                      content={`${integration.type}${integration.count > 1 ? ` (${integration.count})` : ''}`}
                    >
                      <Icon name={getIntegrationIcon(integration.type)} />
                    </Tooltip>
                  ))}
                </Stack>
              )}
              <span>{original.name}</span>
            </Stack>
          </div>
        );
      },
    },
    {
      id: 'integrations',
      header: t('receivers.column.integrations', 'Integrations'),
      cell: ({ row: { original } }: { row: { original: Receiver } }) => (
        <div className={clickableCellStyles} onClick={() => setSelectedReceiver(original)}>
          {getContactPointDescription(original)}
        </div>
      ),
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
      {selectedReceiver && (
        <ReceiverDrawer
          receiver={selectedReceiver}
          onClose={() => {
            setSelectedReceiver(null);
          }}
        />
      )}
    </AlertmanagerPage>
  );
}

export default ReceiversPage;
