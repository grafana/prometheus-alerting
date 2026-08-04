import { css } from '@emotion/css';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, LinkButton, Stack, Field, Input, useStyles2, FieldSet, EmptyState } from '@grafana/ui';
import { testIds } from '../../../components/testIds';
import { useTimeIntervals } from '../hooks/useTimeIntervals';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { prefixRoute } from '../../../utils/utils.routing';
import { ROUTES } from '../../../constants';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { AlertmanagerError } from '../../../components/AlertmanagerError';

interface TimeIntervalItemProps {
  timeInterval: NonNullable<TimeInterval['time_intervals']>[number];
  index: number;
}

function TimeIntervalItem({ timeInterval, index }: TimeIntervalItemProps) {
  const styles = useStyles2(getStyles);

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

  return (
    <FieldSet
      label={t('time-intervals.detail.interval-label', 'Time interval {{number}}', { number: index + 1 })}
      disabled={true}
    >
      <div className={styles.intervalWrapper}>
        <Stack direction="column" gap={2}>
          <Field label={t('time-intervals.times-label', 'Times')}>
            <Input value={formatTimeRange(timeInterval.times)} disabled />
          </Field>

          {timeInterval.weekdays && timeInterval.weekdays.length > 0 && (
            <Field label={t('time-intervals.weekdays-label', 'Weekdays')}>
              <Input value={formatList(timeInterval.weekdays)} disabled />
            </Field>
          )}

          {timeInterval.days_of_month && timeInterval.days_of_month.length > 0 && (
            <Field label={t('time-intervals.days-of-month-label', 'Days of Month')}>
              <Input value={formatList(timeInterval.days_of_month)} disabled />
            </Field>
          )}

          {timeInterval.months && timeInterval.months.length > 0 && (
            <Field label={t('time-intervals.months-label', 'Months')}>
              <Input value={formatList(timeInterval.months)} disabled />
            </Field>
          )}

          {timeInterval.years && timeInterval.years.length > 0 && (
            <Field label={t('time-intervals.years-label', 'Years')}>
              <Input value={formatList(timeInterval.years)} disabled />
            </Field>
          )}

          {timeInterval.location && (
            <Field label={t('time-intervals.location-label', 'Location')}>
              <Input value={timeInterval.location} disabled />
            </Field>
          )}
        </Stack>
      </div>
    </FieldSet>
  );
}

interface TimeIntervalDetailsProps {
  timeInterval: TimeInterval;
}

function TimeIntervalDetails({ timeInterval }: TimeIntervalDetailsProps) {
  if (!timeInterval.time_intervals || timeInterval.time_intervals.length === 0) {
    return (
      <Alert title={t('time-intervals.no-intervals', 'No time intervals')} severity="info">
        {t('time-intervals.no-intervals-desc', 'This time interval has no time ranges configured.')}
      </Alert>
    );
  }

  return (
    <>
      {timeInterval.time_intervals.map((ti, index) => (
        <TimeIntervalItem key={index} timeInterval={ti} index={index} />
      ))}
    </>
  );
}

function TimeIntervalDetail() {
  const { name } = useParams<{ name: string }>();
  const { timeIntervals = [], isLoading, error, refetch } = useTimeIntervals();
  const styles = useStyles2(getStyles);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const timeInterval = timeIntervals.find((ti: TimeInterval) => ti.name === name);

  // If loading is complete and time interval not found, show error
  const notFound = !isLoading && !timeInterval && !error;

  return (
    <AlertmanagerPage
      subTitle={name ? t('time-intervals.detail.subtitle', 'Time interval: {{name}}', { name }) : undefined}
      actions={
        <LinkButton icon="arrow-left" variant="secondary" href={prefixRoute(ROUTES.TimeIntervals)}>
          {t('time-intervals.detail.back', 'Back to time intervals')}
        </LinkButton>
      }
    >
      <div data-testid={testIds.timeIntervals.detail} className={styles.wrapper}>
        {isLoading && <Skeleton height={24} count={10} />}
        {error && (
          <AlertmanagerError
            error={error}
            title={t('time-intervals.detail.error-title', 'Error loading time interval')}
          />
        )}
        {notFound && (
          <EmptyState
            variant="not-found"
            message={t('time-intervals.detail.not-found-title', 'Time interval not found')}
          >
            {t('time-intervals.detail.not-found-message', 'The time interval "{{name}}" does not exist.', { name })}
          </EmptyState>
        )}
        {!isLoading && timeInterval && !error && (
          <Stack direction="column" gap={2}>
            <Field
              label={t('time-intervals.detail.name', 'Name')}
              description={t('time-intervals.detail.name-desc', 'Name of the time interval')}
            >
              <Input value={timeInterval.name} disabled width={39} />
            </Field>

            <TimeIntervalDetails timeInterval={timeInterval} />
          </Stack>
        )}
      </div>
    </AlertmanagerPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    maxWidth: `${theme.breakpoints.values.xl}px`,
  }),
  intervalWrapper: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
  }),
});

export default TimeIntervalDetail;
