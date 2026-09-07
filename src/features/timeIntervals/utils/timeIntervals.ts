import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

/**
 * Returns all configured time intervals, including definitions from Alertmanager's
 * deprecated `mute_time_intervals` field. Modern definitions win when names overlap.
 */
export function mergeTimeIntervals(
  timeIntervals: TimeInterval[] = [],
  legacyMuteTimeIntervals: TimeInterval[] = []
): TimeInterval[] {
  const modernNames = new Set(timeIntervals.map(({ name }) => name));
  const legacyOnlyIntervals = legacyMuteTimeIntervals.filter(({ name }) => !modernNames.has(name));

  return [...timeIntervals, ...legacyOnlyIntervals];
}

function formatTimeRange(times?: Array<{ start_time: string; end_time: string }>): string {
  if (!times || times.length === 0) {
    return t('time-intervals.all-day', 'All day');
  }

  return times.map(({ start_time, end_time }) => `${start_time} - ${end_time}`).join(', ');
}

function formatConstraint(label: string, values?: string[]): string | undefined {
  return values?.length ? `${label}: ${values.join(', ')}` : undefined;
}

/**
 * Formats each alternative in a named time interval. Alertmanager treats multiple
 * entries as OR alternatives and the constraints within one entry as AND conditions.
 */
export function formatTimeIntervalSchedule(interval: TimeInterval): string[] {
  if (!interval.time_intervals || interval.time_intervals.length === 0) {
    return [t('time-intervals.no-intervals-defined', 'No time intervals defined')];
  }

  return interval.time_intervals.map((schedule) => {
    const constraints = [
      `${t('time-intervals.times-label', 'Times')}: ${formatTimeRange(schedule.times)}`,
      formatConstraint(t('time-intervals.weekdays-label', 'Weekdays'), schedule.weekdays),
      formatConstraint(t('time-intervals.days-of-month-label', 'Days of Month'), schedule.days_of_month),
      formatConstraint(t('time-intervals.months-label', 'Months'), schedule.months),
      formatConstraint(t('time-intervals.years-label', 'Years'), schedule.years),
      schedule.location ? `${t('time-intervals.location-label', 'Location')}: ${schedule.location}` : undefined,
    ].filter((constraint): constraint is string => constraint !== undefined);

    return constraints.join(' | ');
  });
}
