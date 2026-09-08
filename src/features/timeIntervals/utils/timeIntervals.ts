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

function getWeekdayLabel(weekday: string): string | undefined {
  switch (weekday) {
    case 'monday':
      return t('time-intervals.weekday.monday', 'Monday');
    case 'tuesday':
      return t('time-intervals.weekday.tuesday', 'Tuesday');
    case 'wednesday':
      return t('time-intervals.weekday.wednesday', 'Wednesday');
    case 'thursday':
      return t('time-intervals.weekday.thursday', 'Thursday');
    case 'friday':
      return t('time-intervals.weekday.friday', 'Friday');
    case 'saturday':
      return t('time-intervals.weekday.saturday', 'Saturday');
    case 'sunday':
      return t('time-intervals.weekday.sunday', 'Sunday');
    default:
      return undefined;
  }
}

function formatWeekday(weekday: string): string {
  const [rangeStart, rangeEnd, ...remainingParts] = weekday.split(':');
  const startLabel = getWeekdayLabel(rangeStart);
  const endLabel = getWeekdayLabel(rangeEnd);

  if (remainingParts.length === 0 && startLabel && endLabel) {
    return `${startLabel}–${endLabel}`;
  }

  return getWeekdayLabel(weekday) ?? weekday;
}

export interface FormattedTimeIntervalSchedule {
  weekdays?: string;
  timeRanges: string[];
  daysOfMonth?: string;
  months?: string;
  years?: string;
  location?: string;
}

/**
 * Formats schedules for structured display. Known weekday names and ranges are
 * localized, while other Alertmanager constraint values remain unchanged.
 */
export function formatTimeIntervalSchedules(interval: TimeInterval): FormattedTimeIntervalSchedule[] {
  return (interval.time_intervals ?? []).map((schedule) => ({
    weekdays: schedule.weekdays?.length ? schedule.weekdays.map(formatWeekday).join(', ') : undefined,
    timeRanges: schedule.times?.length
      ? schedule.times.map(({ start_time, end_time }) => `${start_time}–${end_time}`)
      : [t('time-intervals.all-day', 'All day')],
    daysOfMonth: schedule.days_of_month?.length ? schedule.days_of_month.join(', ') : undefined,
    months: schedule.months?.length ? schedule.months.join(', ') : undefined,
    years: schedule.years?.length ? schedule.years.join(', ') : undefined,
    location: schedule.location || undefined,
  }));
}
