import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { blankTimeIntervalFormData, formDataToTimeInterval, timeIntervalToFormData } from './form';

const businessHours: TimeInterval = {
  name: 'business-hours',
  time_intervals: [
    {
      times: [
        { start_time: '09:00', end_time: '12:00' },
        { start_time: '13:00', end_time: '17:00' },
      ],
      weekdays: ['monday:friday'],
      location: 'Europe/Brussels',
    },
    {
      times: [{ start_time: '10:00', end_time: '14:00' }],
      weekdays: ['saturday', 'sunday'],
      days_of_month: ['1', '-1'],
      months: ['january', 'february'],
      years: ['2026'],
    },
  ],
};

describe('timeIntervalToFormData', () => {
  it('keeps every interval and every time range', () => {
    expect(timeIntervalToFormData(businessHours)).toEqual({
      name: 'business-hours',
      intervals: [
        {
          times: [
            { start_time: '09:00', end_time: '12:00' },
            { start_time: '13:00', end_time: '17:00' },
          ],
          weekdays: 'monday:friday',
          daysOfMonth: undefined,
          months: undefined,
          years: undefined,
          location: 'Europe/Brussels',
        },
        {
          times: [{ start_time: '10:00', end_time: '14:00' }],
          weekdays: 'saturday, sunday',
          daysOfMonth: '1, -1',
          months: 'january, february',
          years: '2026',
          location: undefined,
        },
      ],
    });
  });

  it('shows a blank interval for a time interval that has none', () => {
    expect(timeIntervalToFormData({ name: 'empty' })).toEqual({ ...blankTimeIntervalFormData(), name: 'empty' });
  });

  it('leaves an all-day interval without any time range', () => {
    const formData = timeIntervalToFormData({ name: 'all-day', time_intervals: [{ weekdays: ['monday'] }] });

    expect(formData.intervals[0].times).toEqual([]);
  });
});

describe('formDataToTimeInterval', () => {
  it('round-trips a time interval unchanged', () => {
    expect(formDataToTimeInterval(timeIntervalToFormData(businessHours))).toEqual(businessHours);
  });

  it('writes no times for an interval the user emptied', () => {
    const formData = timeIntervalToFormData({ name: 'all-day', time_intervals: [{ weekdays: ['monday'] }] });

    expect(formDataToTimeInterval(formData)).toEqual({
      name: 'all-day',
      time_intervals: [{ times: undefined, weekdays: ['monday'] }],
    });
  });

  it('drops blank entries from the comma-separated lists', () => {
    const formData = {
      name: 'sloppy',
      intervals: [{ times: [{ start_time: '09:00', end_time: '17:00' }], weekdays: 'monday, , tuesday ', months: ' ' }],
    };

    expect(formDataToTimeInterval(formData)).toEqual({
      name: 'sloppy',
      time_intervals: [
        {
          times: [{ start_time: '09:00', end_time: '17:00' }],
          weekdays: ['monday', 'tuesday'],
          months: undefined,
          days_of_month: undefined,
          years: undefined,
          location: undefined,
        },
      ],
    });
  });
});
