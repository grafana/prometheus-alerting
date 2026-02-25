import React, { useMemo, useState, useCallback } from 'react';
import Skeleton from 'react-loading-skeleton';

import { css } from '@emotion/css';
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
import { useAlertsFilters } from '../hooks/useAlertsFilters';
import { AlertStateBadge } from '../components/AlertStateBadge';
import { AlertStateCounts } from '../components/AlertStateCounts';
import { AlertsFilters } from '../components/AlertsFilters';
import { AlertDrawer } from '../components/AlertDrawer';
import { deduplicateGroups, GroupedAlerts } from '../utils/alerts.utils';

function AlertsPage() {
  const { alertGroups, isLoading, isSuccess, error } = useAlertGroups();
  const { filters, actions, applyFilters } = useAlertsFilters();
  const filteredGroups = deduplicateGroups(applyFilters(alertGroups));

  const columns = useMemo<Array<Column<GroupedAlerts>>>(
    () => [
      {
        id: 'receiver',
        header: t('alerts.column.receiver', 'Receiver'),
        cell: ({ row: { original } }) => <Text variant="body">{original.receivers.join(', ')}</Text>,
      },
      {
        id: 'labels',
        header: t('alerts.column.grouped-by', 'Grouped by'),
        cell: ({ row: { original } }) => (
          <Stack direction="row" gap={0.5} wrap="wrap">
            {Object.entries(original.group.labels).map(([key, value]) => (
              <AlertLabel key={key} value={`${key}=${value}`} colorBy="value" size="sm" />
            ))}
          </Stack>
        ),
      },
      {
        id: 'count',
        header: t('alerts.column.count', 'Alerts'),
        cell: ({ row: { original } }) => <AlertStateCounts alerts={original.group.alerts} />,
      },
    ],
    []
  );

  return (
    <AlertmanagerPage subTitle={t('pages.alerts.subtitle', 'Alert instances grouped by Alertmanager')}>
      <div data-testid={testIds.alerts.container}>
        <AlertsFilters filters={filters} actions={actions} alertGroups={alertGroups} />
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={filteredGroups.length === 0}
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
          <InteractiveTable<GroupedAlerts>
            columns={columns}
            data={filteredGroups}
            getRowId={(_group, index) => String(index)}
            pageSize={DEFAULT_PAGE_SIZE}
            renderExpandedRow={({ group }) => <AlertGroupExpansion group={group} />}
            showExpandAll
          />
        </ViewState>
      </div>
    </AlertmanagerPage>
  );
}

function AlertGroupExpansion({ group }: { group: AlertGroup }) {
  const [selectedAlert, setSelectedAlert] = useState<GettableAlert | null>(null);

  const handleAlertClick = useCallback((alert: GettableAlert) => {
    setSelectedAlert(alert);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedAlert(null);
  }, []);

  const clickableCellStyles = css({ cursor: 'pointer' });

  const alertColumns = useMemo<Array<Column<GettableAlert>>>(
    () => [
      {
        id: 'state',
        header: t('alerts.column.state', 'State'),
        cell: ({ row: { original: alert } }) => (
          <div className={clickableCellStyles} onClick={() => handleAlertClick(alert)}>
            <AlertStateBadge alert={alert} />
          </div>
        ),
      },
      {
        id: 'labels',
        header: t('alerts.column.labels', 'Labels'),
        cell: ({ row: { original: alert } }) => (
          <div className={clickableCellStyles} onClick={() => handleAlertClick(alert)}>
            <Stack direction="row" gap={0.5} wrap="wrap">
              {Object.entries(alert.labels).map(([key, value]) => (
                <AlertLabel key={key} value={`${key}=${value}`} colorBy="value" size="sm" />
              ))}
            </Stack>
          </div>
        ),
      },
      {
        id: 'startsAt',
        header: t('alerts.column.starts-at', 'Started'),
        cell: ({ row: { original: alert } }) => (
          <div className={clickableCellStyles} onClick={() => handleAlertClick(alert)}>
            <Text variant="bodySmall">{new Date(alert.startsAt).toLocaleString()}</Text>
          </div>
        ),
      },
    ],
    [clickableCellStyles, handleAlertClick]
  );

  return (
    <>
      <InteractiveTable<GettableAlert>
        columns={alertColumns}
        data={group.alerts}
        getRowId={(alert) => alert.fingerprint}
      />
      {selectedAlert && <AlertDrawer alert={selectedAlert} onClose={handleDrawerClose} />}
    </>
  );
}

export default AlertsPage;
