import React, { useEffect, useState, useCallback } from 'react';
import Skeleton from 'react-loading-skeleton';

import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { InteractiveTable, EmptyState, Icon, Stack, Tooltip, Button } from '@grafana/ui';
import { type Receiver } from '@grafana/external-alertmanager/vanilla';

import { useReceivers } from '../hooks/useReceivers';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ViewState } from '../../../components/ViewState';
import { getContactPointDescription, getReceiverIntegrations } from '../utils/receiversUtils';
import { getIntegrationIcon } from '../utils/integrationIcons';
import { ReceiverDrawer, DrawerMode } from '../components/ReceiverDrawer';
import { DEFAULT_PAGE_SIZE } from '../../../constants';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { AlertmanagerError } from '../../../components/AlertmanagerError';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';

import { t, Trans } from '@grafana/i18n';

function ReceiversPage() {
  const [triggerFetch, { receivers = [], isLoading, error, isSuccess }] = useReceivers();
  const [selectedReceiver, setSelectedReceiver] = useState<Receiver | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(DrawerMode.View);
  const canMutateReceivers = isAbilityAllowed(useAlertmanagerConfigMutationAbility());

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

  const handleSaved = useCallback(async () => {
    // Refetch receivers after create/update/delete, and wait for it to resolve before the
    // drawer closes — otherwise a receiver reopened immediately after saving (e.g. by an
    // automated test right after the "saved" toast) can still read the pre-update list.
    await triggerFetch();
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
        canMutateReceivers && (
          <Button icon="plus" onClick={handleCreateReceiver}>
            <Trans i18nKey="receivers.create-button">Create receiver</Trans>
          </Button>
        )
      }
    >
      <div data-testid={testIds.receivers.container}>
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={receivers.length === 0}
          loading={<Skeleton height={24} count={5} />}
          renderError={
            <AlertmanagerError error={error} title={t('receivers.error-loading-title', 'Error loading receivers')} />
          }
          empty={
            <EmptyState
              message={t('receivers.no-receivers-message', 'No receivers are configured in the Alertmanager.')}
              variant="call-to-action"
              button={
                canMutateReceivers && (
                  <Button icon="plus" onClick={handleCreateReceiver}>
                    <Trans i18nKey="receivers.create-button">Create receiver</Trans>
                  </Button>
                )
              }
            />
          }
        >
          <InteractiveTable
            columns={columns}
            data={receivers}
            getRowId={(receiver) => receiver.name}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        </ViewState>
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
