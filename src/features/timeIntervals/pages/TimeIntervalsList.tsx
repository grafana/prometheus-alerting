import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { Alert, LinkButton, InteractiveTable, EmptyState, TextLink, Button } from '@grafana/ui';
import { useTimeIntervals } from '../hooks/useTimeIntervals';
import { t } from '@grafana/i18n';
import { DEFAULT_PAGE_SIZE, ROUTES } from '../../../constants';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { prefixRoute } from '../../../utils/utils.routing';
import { useProduceNewAlertmanagerConfiguration } from '../../../hooks/useProduceNewAlertmanagerConfiguration';
import { deleteMuteTimingAction } from '../../../reducers/alertmanager/timeIntervals';
import { useHasConfigurationAPI } from '../../../hooks/useHasConfigurationAPI';

function TimeIntervalsPage() {
  const { timeIntervals, isLoading, error } = useTimeIntervals();
  const hasConfigurationAPI = useHasConfigurationAPI();

  const [produceNewConfig, { error: deleteError }] = useProduceNewAlertmanagerConfiguration();
  const [deletingName, setDeletingName] = useState<string | null>(null);

  const handleDelete = async (name: string) => {
    if (
      !window.confirm(t('time-intervals.delete-confirm', `Are you sure you want to delete time interval "${name}"?`))
    ) {
      return;
    }

    setDeletingName(name);
    try {
      await produceNewConfig(deleteMuteTimingAction({ name }));
      // The list will automatically refresh due to cache invalidation
    } catch (err) {
      console.error('Failed to delete time interval:', err);
    } finally {
      setDeletingName(null);
    }
  };

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

  const baseColumns = [
    {
      id: 'name',
      header: t('time-intervals.column.name', 'Name'),
      cell: ({ row: { original } }: { row: { original: TimeInterval } }) => (
        <TextLink href={prefixRoute(`${ROUTES.TimeIntervals}/${encodeURIComponent(original.name)}`)}>
          {original.name}
        </TextLink>
      ),
    },
    {
      id: 'details',
      header: t('time-intervals.column.details', 'Details'),
      cell: ({ row: { original } }: { row: { original: TimeInterval } }) => (
        <div style={{ whiteSpace: 'pre-line' }}>{formatTimeIntervalDetails(original)}</div>
      ),
    },
  ];

  const actionsColumn = {
    id: 'actions',
    header: t('time-intervals.column.actions', 'Actions'),
    cell: ({ row: { original } }: { row: { original: TimeInterval } }) => (
      <Button
        variant="destructive"
        size="sm"
        icon="trash-alt"
        disabled={deletingName === original.name}
        onClick={() => handleDelete(original.name)}
      >
        {deletingName === original.name
          ? t('time-intervals.deleting', 'Deleting...')
          : t('time-intervals.delete-button', 'Delete')}
      </Button>
    ),
  };

  const columns = hasConfigurationAPI ? [...baseColumns, actionsColumn] : baseColumns;

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
        {deleteError ? (
          <Alert title={t('time-intervals.error-deleting-title', 'Error deleting time interval')} severity="error">
            {deleteError instanceof Error
              ? deleteError.message
              : t('time-intervals.error-deleting-message', 'Failed to delete time interval')}
          </Alert>
        ) : null}
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
    </AlertmanagerPage>
  );
}

export default TimeIntervalsPage;
