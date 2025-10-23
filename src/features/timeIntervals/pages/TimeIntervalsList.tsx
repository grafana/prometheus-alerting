import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { Alert, LinkButton, InteractiveTable, EmptyState } from '@grafana/ui';
import { useTimeIntervals } from '../hooks/useTimeIntervals';
import { t } from '@grafana/i18n';
import { DEFAULT_PAGE_SIZE, ROUTES } from '../../../constants';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { prefixRoute } from '../../../utils/utils.routing';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';
import { TimeIntervalDrawer } from '../components/TimeIntervalDrawer';

function TimeIntervalsPage() {
  const { timeIntervals, isLoading, error } = useTimeIntervals();
  const hasConfigurationAPI = useHasConfigurationAPI();

  const [selectedTimeInterval, setSelectedTimeInterval] = useState<TimeInterval | null>(null);

  const clickableCellStyles = css({
    cursor: 'pointer',
  });

  const formatTimeRange = (times?: Array<{ start_time: string; end_time: string }>) => {
    if (!times || times.length === 0) {
      return t('time-intervals.all-day', 'All day');
    }
    return times.map((t) => `${t.start_time} - ${t.end_time}`).join(', ');
  };

  const formatList = (items?: string[]) => {
    if (!items || items.length === 0) {
      return t('time-intervals.all', 'All');
    }
    return items.join(', ');
  };

  const formatTimeIntervalDetails = (interval: TimeInterval) => {
    if (!interval.time_intervals || interval.time_intervals.length === 0) {
      return t('time-intervals.no-intervals-defined', 'No time intervals defined');
    }

    return interval.time_intervals
      .map((ti, index) => {
        const parts: string[] = [];

        parts.push(`${t('time-intervals.times-label', 'Times')}: ${formatTimeRange(ti.times)}`);

        if (ti.weekdays && ti.weekdays.length > 0) {
          parts.push(`${t('time-intervals.weekdays-label', 'Weekdays')}: ${formatList(ti.weekdays)}`);
        }
        if (ti.days_of_month && ti.days_of_month.length > 0) {
          parts.push(`${t('time-intervals.days-of-month-label', 'Days of Month')}: ${formatList(ti.days_of_month)}`);
        }
        if (ti.months && ti.months.length > 0) {
          parts.push(`${t('time-intervals.months-label', 'Months')}: ${formatList(ti.months)}`);
        }
        if (ti.years && ti.years.length > 0) {
          parts.push(`${t('time-intervals.years-label', 'Years')}: ${formatList(ti.years)}`);
        }
        if (ti.location) {
          parts.push(`${t('time-intervals.location-label', 'Location')}: ${ti.location}`);
        }

        return parts.join(' | ');
      })
      .join('\n');
  };

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
          <div style={{ whiteSpace: 'pre-line' }}>{formatTimeIntervalDetails(original)}</div>
        </div>
      ),
    },
  ];

  return (
    <AlertmanagerPage>
      {hasConfigurationAPI && (
        <LinkButton href={prefixRoute(ROUTES.CreateTimeInterval)}>
          {t('time-intervals.create-button', 'Create time interval')}
        </LinkButton>
      )}
      <div data-testid={testIds.timeIntervals.container}>
        {isLoading && (
          <div>
            <Skeleton height={50} style={{ marginBottom: '10px' }} />
            <Skeleton height={120} count={3} style={{ marginBottom: '5px' }} />
          </div>
        )}
        {error && (
          <Alert title={t('time-intervals.error-loading-title', 'Error loading time intervals')} severity="error">
            {JSON.stringify(error, null, 2)}
            {error instanceof Error
              ? error.message
              : t('time-intervals.error-loading-message', 'Failed to fetch time intervals')}
          </Alert>
        )}

        {!isLoading && timeIntervals.length > 0 && !error && (
          <InteractiveTable
            columns={columns}
            data={timeIntervals}
            getRowId={(interval) => interval.name}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        )}
        {!isLoading && timeIntervals.length === 0 && !error && (
          <EmptyState
            message={t(
              'time-intervals.no-time-intervals-message',
              'No time intervals are configured in the Alertmanager.'
            )}
            variant="call-to-action"
          />
        )}
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
