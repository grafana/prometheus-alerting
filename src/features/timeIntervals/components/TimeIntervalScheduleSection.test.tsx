import React from 'react';
import { render, screen } from '@testing-library/react';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { keyValueRowsUnder } from '../../../test/utils/keyValueList';
import { TimeIntervalScheduleSection } from './TimeIntervalScheduleSection';

describe('TimeIntervalScheduleSection', () => {
  it('shows a single schedule with a row per constraint and no "or"', () => {
    const interval: TimeInterval = {
      name: 'split-shift',
      time_intervals: [
        {
          weekdays: ['monday:friday'],
          times: [
            { start_time: '09:00', end_time: '12:00' },
            { start_time: '13:00', end_time: '17:00' },
          ],
          days_of_month: ['1:7'],
          months: ['january'],
          years: ['2026'],
          location: 'Europe/Berlin',
        },
      ],
    };

    render(<TimeIntervalScheduleSection timeInterval={interval} />);

    expect(keyValueRowsUnder('Schedule')).toEqual([
      ['Times', '09:00–12:00, 13:00–17:00'],
      ['Weekdays', 'Monday–Friday'],
      ['Days of Month', '1:7'],
      ['Months', 'january'],
      ['Years', '2026'],
      ['Timezone', 'Europe/Berlin'],
    ]);
    expect(screen.queryByText('or')).not.toBeInTheDocument();
  });

  it('puts several schedules in the same section with an "or" between them, leaving out unset constraints', () => {
    const interval: TimeInterval = {
      name: 'special-hours',
      time_intervals: [{ weekdays: ['saturday', 'sunday'] }, { times: [{ start_time: '00:00', end_time: '06:00' }] }],
    };

    render(<TimeIntervalScheduleSection timeInterval={interval} />);

    expect(keyValueRowsUnder('Schedule')).toEqual([
      ['Times', 'All day'],
      ['Weekdays', 'Saturday, Sunday'],
      ['Times', '00:00–06:00'],
    ]);
    expect(screen.getAllByText('or')).toHaveLength(1);
  });
});
