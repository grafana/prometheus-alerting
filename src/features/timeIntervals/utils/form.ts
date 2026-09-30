import { z } from 'zod';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

/**
 * The form shape for a time interval, and the two functions that convert between it and the
 * Alertmanager representation.
 *
 * A time interval holds a list of intervals, and each of those holds a list of start/end times.
 * The form mirrors that nesting: anything the user had before an edit is still there after it.
 * The only difference is that weekdays, days of month, months and years are edited as
 * comma-separated text, so those are strings here and lists in the Alertmanager config.
 */

const TimeRangeFormSchema = z.object({
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
});

const IntervalFormSchema = z.object({
  times: z.array(TimeRangeFormSchema),
  weekdays: z.string().optional(),
  daysOfMonth: z.string().optional(),
  months: z.string().optional(),
  years: z.string().optional(),
  location: z.string().optional(),
});

export const TimeIntervalFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  intervals: z.array(IntervalFormSchema).min(1, 'At least one interval is required'),
});

export type TimeIntervalFormData = z.infer<typeof TimeIntervalFormSchema>;
export type IntervalFormData = z.infer<typeof IntervalFormSchema>;

const DEFAULT_START_TIME = '00:00';
const DEFAULT_END_TIME = '23:59';

/** A blank interval, used for a new time interval and for "Add interval". */
export function blankInterval(): IntervalFormData {
  return {
    times: [{ start_time: DEFAULT_START_TIME, end_time: DEFAULT_END_TIME }],
    weekdays: undefined,
    daysOfMonth: undefined,
    months: undefined,
    years: undefined,
    location: undefined,
  };
}

export function blankTimeIntervalFormData(): TimeIntervalFormData {
  return { name: '', intervals: [blankInterval()] };
}

export function timeIntervalToFormData(timeInterval: TimeInterval): TimeIntervalFormData {
  const intervals: IntervalFormData[] = (timeInterval.time_intervals ?? []).map((interval) => ({
    // An interval with no times means "all day", so an empty list here is meaningful — don't
    // invent a range for it.
    times: (interval.times ?? []).map(({ start_time, end_time }) => ({ start_time, end_time })),
    weekdays: joinList(interval.weekdays),
    daysOfMonth: joinList(interval.days_of_month),
    months: joinList(interval.months),
    years: joinList(interval.years),
    location: interval.location,
  }));

  return {
    name: timeInterval.name,
    intervals: intervals.length > 0 ? intervals : [blankInterval()],
  };
}

export function formDataToTimeInterval(data: TimeIntervalFormData): TimeInterval {
  return {
    name: data.name,
    time_intervals: data.intervals.map((interval) => ({
      times:
        interval.times.length > 0
          ? interval.times.map(({ start_time, end_time }) => ({ start_time, end_time }))
          : undefined,
      weekdays: splitList(interval.weekdays),
      days_of_month: splitList(interval.daysOfMonth),
      months: splitList(interval.months),
      years: splitList(interval.years),
      location: interval.location || undefined,
    })),
  };
}

function joinList(items: string[] | undefined): string | undefined {
  return items && items.length > 0 ? items.join(', ') : undefined;
}

function splitList(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');

  return items.length > 0 ? items : undefined;
}
