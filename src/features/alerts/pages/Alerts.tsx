import React, { useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';

import { t } from '@grafana/i18n';
import { AlertLabel } from '@grafana/alerting';
import { Column, EmptyState, InteractiveTable, Stack, Text } from '@grafana/ui';
import type { AlertGroup, GettableAlert } from '@grafana/external-alertmanager/vanilla';

import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { ViewState } from '../../../components/ViewState';
import { testIds } from '../../../components/testIds';
import { DEFAULT_PAGE_SIZE } from '../../../constants';
import { useAlertGroups } from '../hooks/useAlertGroups';
import { AlertStateBadge } from '../components/AlertStateBadge';
import { AlertStateCounts } from '../components/AlertStateCounts';

function AlertsPage() {
  const { alertGroups, isLoading, isSuccess, error } = useAlertGroups();

  const columns = useMemo<Array<Column<AlertGroup>>>(
    () => [
      {
        id: 'receiver',
        header: t('alerts.column.receiver', 'Receiver'),
        cell: ({ row: { original } }) => <Text variant="body">{original.receiver.name}</Text>,
      },
      {
        id: 'labels',
        header: t('alerts.column.grouped-by', 'Grouped by'),
        cell: ({ row: { original } }) => (
          <Stack direction="row" gap={0.5} wrap="wrap">
            {Object.entries(original.labels).map(([key, value]) => (
              <AlertLabel key={key} value={`${key}=${value}`} colorBy="value" size="sm" />
            ))}
          </Stack>
        ),
      },
      {
        id: 'count',
        header: t('alerts.column.count', 'Alerts'),
        cell: ({ row: { original } }) => <AlertStateCounts alerts={original.alerts} />,
      },
    ],
    []
  );

  return (
    <AlertmanagerPage subTitle={t('pages.alerts.subtitle', 'Alert instances grouped by Alertmanager')}>
      <div data-testid={testIds.alerts.container}>
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={alertGroups.length === 0}
          loading={
            <div>
              <Skeleton height={50} style={{ marginBottom: '10px' }} />
              <Skeleton height={40} count={5} style={{ marginBottom: '5px' }} />
            </div>
          }
          renderError={
            <DataSourceError error={error} title={t('alerts.error-loading-title', 'Error loading alert groups')} />
          }
          empty={
            <EmptyState
              message={t('alerts.no-alerts-message', 'No active alerts found in the Alertmanager.')}
              variant="call-to-action"
            />
          }
        >
          <InteractiveTable<AlertGroup>
            columns={columns}
            data={alertGroups}
            getRowId={(_group, index) => String(index)}
            pageSize={DEFAULT_PAGE_SIZE}
            renderExpandedRow={(group) => <AlertGroupExpansion original={group} />}
            showExpandAll
          />
        </ViewState>
      </div>
    </AlertmanagerPage>
  );
}

function AlertGroupExpansion({ original }: { original: AlertGroup }) {
  const alertColumns = useMemo<Array<Column<GettableAlert>>>(
    () => [
      {
        id: 'state',
        header: t('alerts.column.state', 'State'),
        cell: ({ row: { original: alert } }) => <AlertStateBadge alert={alert} />,
      },
      {
        id: 'labels',
        header: t('alerts.column.labels', 'Labels'),
        cell: ({ row: { original: alert } }) => (
          <Stack direction="row" gap={0.5} wrap="wrap">
            {Object.entries(alert.labels).map(([key, value]) => (
              <AlertLabel key={key} value={`${key}=${value}`} colorBy="value" size="sm" />
            ))}
          </Stack>
        ),
      },
      {
        id: 'startsAt',
        header: t('alerts.column.starts-at', 'Started'),
        cell: ({ row: { original: alert } }) => (
          <Text variant="bodySmall">{new Date(alert.startsAt).toLocaleString()}</Text>
        ),
      },
    ],
    []
  );

  return (
    <InteractiveTable<GettableAlert>
      columns={alertColumns}
      data={original.alerts}
      getRowId={(alert) => alert.fingerprint}
    />
  );
}

export default AlertsPage;
