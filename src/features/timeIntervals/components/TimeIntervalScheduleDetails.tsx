import { css } from '@emotion/css';
import React from 'react';

import type { GrafanaTheme2 } from '@grafana/data';
import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { Box, Grid, Stack, Text, useStyles2 } from '@grafana/ui';

import { formatTimeIntervalSchedules, type FormattedTimeIntervalSchedule } from '../utils/timeIntervals';

interface TimeIntervalScheduleDetailsProps {
  timeInterval: TimeInterval;
}

/** Displays each Alertmanager schedule alternative as a separate card. */
export function TimeIntervalScheduleDetails({ timeInterval }: TimeIntervalScheduleDetailsProps) {
  const schedules = formatTimeIntervalSchedules(timeInterval);

  if (schedules.length === 0) {
    return (
      <Text variant="bodySmall" color="secondary">
        {t('time-intervals.no-intervals-defined', 'No time intervals defined')}
      </Text>
    );
  }

  return (
    <Grid minColumnWidth={34} gap={1}>
      {schedules.map((schedule, index) => (
        <ScheduleCard schedule={schedule} key={index} />
      ))}
    </Grid>
  );
}

function ScheduleCard({ schedule }: { schedule: FormattedTimeIntervalSchedule }) {
  const styles = useStyles2(getStyles);

  return (
    <Box padding={1.5} backgroundColor="secondary" borderRadius="default" minWidth={0}>
      <Stack direction="column" gap={1}>
        <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
          <Text variant="bodySmall" color="secondary" weight="medium">
            {t('time-intervals.times-label', 'Times')}:
          </Text>
          {schedule.timeRanges.map((timeRange, rangeIndex) => (
            <span className={styles.timeRange} key={`${timeRange}-${rangeIndex}`}>
              <Text variant="bodySmall">{timeRange}</Text>
            </span>
          ))}
        </Stack>

        {schedule.weekdays && (
          <Constraint label={t('time-intervals.weekdays-label', 'Weekdays')} value={schedule.weekdays} />
        )}
        {schedule.daysOfMonth && (
          <Constraint label={t('time-intervals.days-of-month-label', 'Days of Month')} value={schedule.daysOfMonth} />
        )}
        {schedule.months && <Constraint label={t('time-intervals.months-label', 'Months')} value={schedule.months} />}
        {schedule.years && <Constraint label={t('time-intervals.years-label', 'Years')} value={schedule.years} />}

        {schedule.location && (
          <Text variant="bodySmall" color="secondary">
            {t('time-intervals.timezone-label', 'Timezone')}: {schedule.location}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

function Constraint({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" gap={0.5} alignItems="baseline" wrap="wrap">
      <Text variant="bodySmall" color="secondary" weight="medium">
        {label}:
      </Text>
      <Text variant="bodySmall">{value}</Text>
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  timeRange: css({
    display: 'inline-flex',
    padding: theme.spacing(0.25, 0.75),
    whiteSpace: 'nowrap',
    background: theme.colors.background.primary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
  }),
});
