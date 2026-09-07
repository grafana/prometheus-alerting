import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { formatTimeIntervalSchedule, mergeTimeIntervals } from './timeIntervals';

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

describe('formatTimeIntervalSchedule', () => {
  it('formats an interval without a configured schedule', () => {
    expect(formatTimeIntervalSchedule(buildTimeInterval('empty'))).toEqual(['No time intervals defined']);
  });

  it('formats time, weekday, and location constraints together', () => {
    const interval: TimeInterval = {
      name: 'business-hours',
      time_intervals: [
        {
          times: [{ start_time: '09:00', end_time: '17:00' }],
          weekdays: ['monday:friday'],
          location: 'Europe/Berlin',
        },
      ],
    };

    expect(formatTimeIntervalSchedule(interval)).toEqual([
      'Times: 09:00 - 17:00 | Weekdays: monday:friday | Location: Europe/Berlin',
    ]);
  });

  it('returns multiple schedule alternatives separately', () => {
    const interval: TimeInterval = {
      name: 'office-hours',
      time_intervals: [{ weekdays: ['monday:friday'] }, { months: ['december'], days_of_month: ['24:26'] }],
    };

    expect(formatTimeIntervalSchedule(interval)).toEqual([
      'Times: All day | Weekdays: monday:friday',
      'Times: All day | Days of Month: 24:26 | Months: december',
    ]);
  });
});
