import React, { useEffect, useState, useCallback } from 'react';
import Skeleton from 'react-loading-skeleton';

import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { InteractiveTable, EmptyState, Icon, Stack, Tooltip, Button } from '@grafana/ui';
import { type Receiver } from '@grafana/external-alertmanager/vanilla';

import { useReceivers } from '../hooks/useReceivers';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { getContactPointDescription, getReceiverIntegrations } from '../utils/receiversUtils';
import { getIntegrationIcon } from '../utils/integrationIcons';
import { ReceiverDrawer, DrawerMode } from '../components/ReceiverDrawer';
import { DEFAULT_PAGE_SIZE } from '../../../constants';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';

import { t, Trans } from '@grafana/i18n';

function ReceiversPage() {
  const [triggerFetch, { receivers = [], isLoading, error, isSuccess }] = useReceivers();
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(DrawerMode.View);
  const hasConfigurationAPI = useHasConfigurationAPI();

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const handleCreateReceiver = useCallback(() => {
    setSelectedReceiver(null);
    setDrawerMode(DrawerMode.Add);
  }, []);

  const handleReceiverClick = useCallback((receiver: Receiver) => {
    setSelectedReceiver(receiver);
    setDrawerMode(DrawerMode.View);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedReceiver(null);
    setDrawerMode(DrawerMode.View);
  }, []);

  const handleSaved = useCallback(() => {
    // Refetch receivers after create/update/delete
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
          <div className={clickableCellStyles} onClick={() => handleReceiverClick(original)}>
            <Stack direction="row" gap={1} alignItems="center">
              {integrations.length > 0 && (
                <Stack direction="row" gap={0.5}>
                  {integrations.map((integration) => (
                    <Tooltip
                      key={integration.type}
                      content={t('receivers.tooltip.integration-count', '{{type}}{{count}}', {
                        type: integration.type,
                        count: integration.count > 1 ? ` (${integration.count})` : '',
                      })}
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
        <div className={clickableCellStyles} onClick={() => handleReceiverClick(original)}>
          {getContactPointDescription(original)}
        </div>
      ),
    },
  ];

  const isDrawerOpen = selectedReceiver !== null || drawerMode === DrawerMode.Add;

  return (
    <AlertmanagerPage
      subTitle={t('receivers.page-subtitle', 'Configure how and where to send alert notifications')}
      actions={
        hasConfigurationAPI && (
          <Button icon="plus" onClick={handleCreateReceiver}>
            <Trans i18nKey="receivers.create-button">Create receiver</Trans>
          </Button>
        )
      }
    >
      <div data-testid={testIds.receivers.container}>
        {isLoading && <Skeleton height={24} count={5} />}
        {error && (
          <DataSourceError error={error} title={t('receivers.error-loading-title', 'Error loading receivers')} />
        )}
        {!isLoading && isSuccess && Boolean(receivers.length) && !error && (
          <InteractiveTable
            columns={columns}
            data={receivers}
            getRowId={(receiver) => receiver.name}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        )}
        {!isLoading && isSuccess && receivers.length === 0 && !error && (
          <EmptyState
            message={t('receivers.no-receivers-message', 'No receivers are configured in the Alertmanager.')}
            variant="call-to-action"
            button={
              hasConfigurationAPI && (
                <Button icon="plus" onClick={handleCreateReceiver}>
                  <Trans i18nKey="receivers.create-button">Create receiver</Trans>
                </Button>
              )
            }
          />
        )}
      </div>
      {isDrawerOpen && (
        <ReceiverDrawer
          receiver={selectedReceiver}
          existingReceivers={receivers}
          onClose={handleDrawerClose}
          onSaved={handleSaved}
          initialMode={drawerMode}
        />
      )}
    </AlertmanagerPage>
  );
}

export default ReceiversPage;
