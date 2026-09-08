import React from 'react';
import { render, screen } from '@testing-library/react';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { RouteTimingSummary } from './RouteTimingSummary';

const timeIntervals: TimeInterval[] = [
  {
    name: 'business-hours',
    time_intervals: [
      {
        times: [{ start_time: '09:00', end_time: '17:00' }],
        weekdays: ['monday:friday'],
        location: 'Europe/Berlin',
      },
    ],
  },
  {
    name: 'holidays',
    time_intervals: [{ months: ['december'], days_of_month: ['24:26'] }, { weekdays: ['sunday'] }],
  },
];

describe('RouteTimingSummary', () => {
  it('does not render when no timings are selected', () => {
    render(
      <RouteTimingSummary muteTimeIntervalNames={[]} activeTimeIntervalNames={[]} timeIntervals={timeIntervals} />
    );

    expect(screen.queryByRole('heading', { name: 'Timing behavior' })).not.toBeInTheDocument();
  });

  it('summarizes active schedules', () => {
    render(
      <RouteTimingSummary
        muteTimeIntervalNames={[]}
        activeTimeIntervalNames={['business-hours']}
        timeIntervals={timeIntervals}
      />
    );

    expect(
      screen.getByText('Notifications are sent only when at least one active timing matches.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByText('business-hours')).toBeInTheDocument();
    expect(screen.getByText('Monday–Friday')).toBeInTheDocument();
    expect(screen.getByText('09:00–17:00')).toBeInTheDocument();
    expect(screen.getByText('Timezone: Europe/Berlin')).toBeInTheDocument();
  });

  it('explains that active and mute timing conditions both apply', () => {
    render(
      <RouteTimingSummary
        muteTimeIntervalNames={['holidays']}
        activeTimeIntervalNames={['business-hours']}
        timeIntervals={timeIntervals}
      />
    );

    expect(
      screen.getByText(
        'Both conditions apply: notifications are sent only when at least one active timing matches and no mute timing matches.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Muted' })).toBeInTheDocument();
    expect(screen.getByText('Days of Month:')).toBeInTheDocument();
    expect(screen.getByText('24:26')).toBeInTheDocument();
    expect(screen.getByText('Months:')).toBeInTheDocument();
    expect(screen.getByText('december')).toBeInTheDocument();
    expect(screen.queryByText('OR')).not.toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
  });
});
