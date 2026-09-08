import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { formatTimeIntervalSchedules, mergeTimeIntervals } from './timeIntervals';

function buildTimeInterval(name: string, weekdays: string[] = []): TimeInterval {
  return {
    name,
    time_intervals: weekdays.length > 0 ? [{ weekdays }] : [],
  };
}

describe('mergeTimeIntervals', () => {
  it('includes modern and legacy interval definitions', () => {
    const modern = buildTimeInterval('business-hours');
    const legacy = buildTimeInterval('weekends');

    expect(mergeTimeIntervals([modern], [legacy])).toEqual([modern, legacy]);
  });

  it('prefers the modern definition when names overlap', () => {
    const modern = buildTimeInterval('business-hours', ['monday:friday']);
    const legacy = buildTimeInterval('business-hours', ['saturday', 'sunday']);

    expect(mergeTimeIntervals([modern], [legacy])).toEqual([modern]);
  });
});

describe('formatTimeIntervalSchedules', () => {
  it('returns no schedules for an interval without definitions', () => {
    expect(formatTimeIntervalSchedules(buildTimeInterval('empty'))).toEqual([]);
  });

  it('formats known weekday ranges with full names and keeps multiple time ranges separate', () => {
    const interval: TimeInterval = {
      name: 'business-hours',
      time_intervals: [
        {
          times: [
            { start_time: '09:00', end_time: '12:00' },
            { start_time: '13:00', end_time: '17:00' },
          ],
          weekdays: ['monday:friday'],
          location: 'Europe/Berlin',
        },
      ],
    };

    expect(formatTimeIntervalSchedules(interval)).toEqual([
      {
        weekdays: 'Monday–Friday',
        timeRanges: ['09:00–12:00', '13:00–17:00'],
        daysOfMonth: undefined,
        months: undefined,
        years: undefined,
        location: 'Europe/Berlin',
      },
    ]);
  });

  it('uses all day only for absent times and preserves complex constraint values', () => {
    const interval: TimeInterval = {
      name: 'special-days',
      time_intervals: [
        {
          weekdays: ['custom-day:other-day'],
          days_of_month: ['-3:-1'],
          months: ['march:may'],
          years: ['2025:2027'],
        },
        { times: [{ start_time: '00:00', end_time: '23:59' }] },
      ],
    };

    expect(formatTimeIntervalSchedules(interval)).toEqual([
      {
        weekdays: 'custom-day:other-day',
        timeRanges: ['All day'],
        daysOfMonth: '-3:-1',
        months: 'march:may',
        years: '2025:2027',
        location: undefined,
      },
      {
        weekdays: undefined,
        timeRanges: ['00:00–23:59'],
        daysOfMonth: undefined,
        months: undefined,
        years: undefined,
        location: undefined,
      },
    ]);
  });
});
