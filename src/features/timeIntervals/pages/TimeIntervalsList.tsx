import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { LinkButton, InteractiveTable, EmptyState } from '@grafana/ui';
import { useTimeIntervals } from '../hooks/useTimeIntervals';
import { t } from '@grafana/i18n';
import { DEFAULT_PAGE_SIZE, ROUTES } from '../../../constants';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ViewState } from '../../../components/ViewState';
import { prefixRoute } from '../../../utils/utils.routing';
import { TimeIntervalDrawer } from '../components/TimeIntervalDrawer';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';
import { AlertmanagerError } from '../../../components/AlertmanagerError';
import { formatTimeIntervalSchedule } from '../utils/timeIntervals';

function TimeIntervalsPage() {
  const { timeIntervals, isLoading, error, isSuccess } = useTimeIntervals();
  const canMutateTimeIntervals = isAbilityAllowed(useAlertmanagerConfigMutationAbility());

  const [selectedTimeInterval, setSelectedTimeInterval] = useState<TimeInterval | null>(null);

  const clickableCellStyles = css({
    cursor: 'pointer',
  });

  const columns = [
    {
      id: 'name',
      header: t('time-intervals.column.name', 'Name'),
      cell: ({ row: { original } }: { row: { original: TimeInterval } }) => (
        <div className={clickableCellStyles} onClick={() => setSelectedTimeInterval(original)}>
          {original.name}
        </div>
      ),
    },
    {
      id: 'details',
      header: t('time-intervals.column.details', 'Details'),
      cell: ({ row: { original } }: { row: { original: TimeInterval } }) => (
        <div className={clickableCellStyles} onClick={() => setSelectedTimeInterval(original)}>
          <div style={{ whiteSpace: 'pre-line' }}>{formatTimeIntervalSchedule(original).join('\n')}</div>
        </div>
      ),
    },
  ];

  return (
    <AlertmanagerPage
      subTitle={t('time-intervals.page-subtitle', 'Define time windows for muting or activating notifications')}
    >
      {canMutateTimeIntervals && (
        <LinkButton href={prefixRoute(ROUTES.CreateTimeInterval)}>
          {t('time-intervals.create-button', 'Create time interval')}
        </LinkButton>
      )}
      <div data-testid={testIds.timeIntervals.container}>
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={timeIntervals.length === 0}
          loading={
            <div>
              <Skeleton height={50} style={{ marginBottom: '10px' }} />
              <Skeleton height={120} count={3} style={{ marginBottom: '5px' }} />
            </div>
          }
          renderError={
            <AlertmanagerError
              error={error}
              title={t('time-intervals.error-loading-title', 'Error loading time intervals')}
            />
          }
          empty={
            <EmptyState
              message={t(
                'time-intervals.no-time-intervals-message',
                'No time intervals are configured in the Alertmanager.'
              )}
              variant="call-to-action"
            />
          }
        >
          <InteractiveTable
            columns={columns}
            data={timeIntervals}
            getRowId={(interval) => interval.name}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        </ViewState>
      </div>
      {selectedTimeInterval && (
        <TimeIntervalDrawer
          timeInterval={selectedTimeInterval}
          onClose={() => {
            setSelectedTimeInterval(null);
          }}
        />
      )}
    </AlertmanagerPage>
  );
}

export default TimeIntervalsPage;
