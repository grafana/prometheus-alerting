import React from 'react';
import { render, screen } from '@testing-library/react';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { TimeIntervalScheduleDetails } from './TimeIntervalScheduleDetails';

describe('TimeIntervalScheduleDetails', () => {
  it('renders multiple time ranges as distinct values in one schedule card', () => {
    const interval: TimeInterval = {
      name: 'split-shift',
      time_intervals: [
        {
          weekdays: ['monday:friday'],
          times: [
            { start_time: '09:00', end_time: '12:00' },
            { start_time: '13:00', end_time: '17:00' },
          ],
          location: 'Europe/Berlin',
        },
      ],
    };

    render(<TimeIntervalScheduleDetails timeInterval={interval} />);

    expect(screen.getByText('Weekdays:')).toBeInTheDocument();
    expect(screen.getByText('Monday–Friday')).toBeInTheDocument();
    expect(screen.getByText('09:00–12:00')).toBeInTheDocument();
    expect(screen.getByText('13:00–17:00')).toBeInTheDocument();
    expect(screen.getByText('Timezone: Europe/Berlin')).toBeInTheDocument();
    expect(screen.queryByText('OR')).not.toBeInTheDocument();
  });

  it('renders separate schedule boxes with labelled constraints', () => {
    const interval: TimeInterval = {
      name: 'special-hours',
      time_intervals: [
        { weekdays: ['saturday', 'sunday'] },
        {
          times: [{ start_time: '00:00', end_time: '23:59' }],
          days_of_month: ['24:26'],
          months: ['december'],
          years: ['2025'],
        },
      ],
    };

    render(<TimeIntervalScheduleDetails timeInterval={interval} />);

    expect(screen.getByText('Saturday, Sunday')).toBeInTheDocument();
    expect(screen.getByText('All day')).toBeInTheDocument();
    expect(screen.queryByText('OR')).not.toBeInTheDocument();
    expect(screen.getAllByText('Weekdays:')).toHaveLength(1);
    expect(screen.getByText('00:00–23:59')).toBeInTheDocument();
    expect(screen.getByText('Days of Month:')).toBeInTheDocument();
    expect(screen.getByText('24:26')).toBeInTheDocument();
    expect(screen.getByText('Months:')).toBeInTheDocument();
    expect(screen.getByText('december')).toBeInTheDocument();
    expect(screen.getByText('Years:')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('shows an explicit message for an interval without schedule definitions', () => {
    render(<TimeIntervalScheduleDetails timeInterval={{ name: 'empty', time_intervals: [] }} />);

    expect(screen.getByText('No time intervals defined')).toBeInTheDocument();
  });
});
