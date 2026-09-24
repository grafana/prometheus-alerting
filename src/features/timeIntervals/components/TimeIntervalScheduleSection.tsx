import React, { Fragment } from 'react';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { Box, Divider, Stack, Text } from '@grafana/ui';

import { KeyValueList } from '../../../components/KeyValueList/KeyValueList';
import { Section } from '../../../components/KeyValueList/Section';
import { formatTimeIntervalSchedules, type FormattedTimeIntervalSchedule } from '../utils/timeIntervals';

interface TimeIntervalScheduleSectionProps {
  timeInterval: TimeInterval;
}

/**
 * Shows the interval's schedules in one section of label/value rows, laid out like the rest of
 * the drawer. The interval matches whenever any one of its schedules does, so they are separated
 * by an "or".
 */
export function TimeIntervalScheduleSection({ timeInterval }: TimeIntervalScheduleSectionProps) {
  const schedules = formatTimeIntervalSchedules(timeInterval);

  return (
    <Section title={t('time-intervals.schedule-title', 'Schedule')}>
      <Stack direction="column" gap={1}>
        {schedules.map((schedule, index) => (
          <Fragment key={index}>
            {index > 0 && <OrDivider />}
            <KeyValueList items={scheduleItems(schedule)} />
          </Fragment>
        ))}
      </Stack>
    </Section>
  );
}

function OrDivider() {
  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Box flex={1}>
        <Divider spacing={0} />
      </Box>
      <Text variant="bodySmall" color="secondary">
        {t('time-intervals.schedule-or', 'or')}
      </Text>
      <Box flex={1}>
        <Divider spacing={0} />
      </Box>
    </Stack>
  );
}

function scheduleItems(schedule: FormattedTimeIntervalSchedule) {
  const items = [{ label: t('time-intervals.times-label', 'Times'), value: schedule.timeRanges.join(', ') }];

  if (schedule.weekdays) {
    items.push({ label: t('time-intervals.weekdays-label', 'Weekdays'), value: schedule.weekdays });
  }
  if (schedule.daysOfMonth) {
    items.push({ label: t('time-intervals.days-of-month-label', 'Days of Month'), value: schedule.daysOfMonth });
  }
  if (schedule.months) {
    items.push({ label: t('time-intervals.months-label', 'Months'), value: schedule.months });
  }
  if (schedule.years) {
    items.push({ label: t('time-intervals.years-label', 'Years'), value: schedule.years });
  }
  if (schedule.location) {
    items.push({ label: t('time-intervals.timezone-label', 'Timezone'), value: schedule.location });
  }

  return items;
}
