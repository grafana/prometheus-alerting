import React, { useEffect, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
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
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteReceiverAction } from '../../../reducers/alertmanager/receivers';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';

import { t } from '@grafana/i18n';

function ReceiversPage() {
  const [triggerFetch, { receivers = [], isLoading, error }] = useReceivers();
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);
  const hasConfigurationAPI = useHasConfigurationAPI();
  const [produceNewConfig, { error: deleteError, isLoading: isDeleting }] = useProduceNewAlertmanagerConfiguration();

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const handleDelete = async (receiver: Receiver) => {
    if (
      !window.confirm(
        t('receivers.delete-confirm', `Are you sure you want to delete receiver "{{name}}"?`, { name: receiver.name })
      )
    ) {
      return;
    }

    try {
      await produceNewConfig(deleteReceiverAction(receiver.name));
      setSelectedReceiver(null);
      // The list will automatically refresh due to cache invalidation
    } catch (err) {
      console.error('Failed to delete receiver:', err);
    }
  };

  const handleEdit = (receiver: Receiver) => {
    // TODO: Implement edit functionality
    console.log('Edit receiver:', receiver.name);
  };

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
        {deleteError && (
          <Alert title={t('receivers.error-deleting-title', 'Error deleting receiver')} severity="error">
            {deleteError instanceof Error
              ? deleteError.message
              : t('receivers.error-deleting-message', 'Failed to delete receiver')}
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
          onEdit={hasConfigurationAPI ? handleEdit : undefined}
          onRemove={hasConfigurationAPI ? handleDelete : undefined}
        />
      )}
    </AlertmanagerPage>
  );
}

export default ReceiversPage;
