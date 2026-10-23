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

// Mirrors Alertmanager's rule: HH:MM, with 24:00 accepted only as an end time.
const TIME_PATTERN = /^(([01][0-9]|2[0-3]):[0-5][0-9]|24:00)$/;

const END_BEFORE_START_MESSAGE = 'End time must be after start time';
// Alertmanager has no ranges that run past midnight, so they have to be split in two.
const PAST_MIDNIGHT_MESSAGE =
  'End time must be after start time. For a range past midnight, add two ranges, e.g. 22:00-24:00 and 00:00-02:00';

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function isValidTimeZone(timeZone: string): boolean {
  // Intl accepts offsets like "+05:00", but Alertmanager only takes zone names.
  if (timeZone.startsWith('+') || timeZone.startsWith('-')) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

const TimeRangeFormSchema = z
  .object({
    start_time: z
      .string()
      .min(1, 'Start time is required')
      .regex(TIME_PATTERN, 'Start time must be in HH:MM format (00:00-23:59)')
      .refine((value) => value !== '24:00', 'Start time must be in HH:MM format (00:00-23:59)'),
    end_time: z
      .string()
      .min(1, 'End time is required')
      .regex(TIME_PATTERN, 'End time must be in HH:MM format (00:00-24:00)'),
  })
  .superRefine(({ start_time, end_time }, ctx) => {
    // Only compare when both are well-formed, so each field shows at most one message.
    if (!TIME_PATTERN.test(start_time) || !TIME_PATTERN.test(end_time)) {
      return;
    }
    const start = toMinutes(start_time);
    const end = toMinutes(end_time);
    if (start >= end) {
      const message = start > end ? PAST_MIDNIGHT_MESSAGE : END_BEFORE_START_MESSAGE;
      ctx.addIssue({ code: 'custom', path: ['end_time'], message });
    }
  });

const IntervalFormSchema = z.object({
  times: z.array(TimeRangeFormSchema),
  weekdays: z.string().optional(),
  daysOfMonth: z.string().optional(),
  months: z.string().optional(),
  years: z.string().optional(),
  // Intl rather than the picker's IANA list: that list is a curated subset, and stored zones outside it are valid.
  location: z
    .string()
    .optional()
    .refine((value) => !value || isValidTimeZone(value), 'Unknown time zone'),
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
