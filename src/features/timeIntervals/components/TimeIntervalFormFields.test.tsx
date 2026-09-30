import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { TimeInterval } from '@grafana/external-alertmanager/vanilla';

import { TimeIntervalFormFields } from './TimeIntervalFormFields';

/** Mon–Fri, mornings and afternoons, plus a separate weekend block. */
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
    },
  ],
};

function renderForm(timeInterval?: TimeInterval) {
  const onSubmit = vi.fn();

  render(
    <TimeIntervalFormFields
      timeInterval={timeInterval}
      onSubmit={onSubmit}
      onCancel={vi.fn()}
      isLoading={false}
      showNameField={!timeInterval}
    />
  );

  return { onSubmit, user: userEvent.setup() };
}

describe('TimeIntervalFormFields', () => {
  it('shows every interval and every time range of the interval being edited', () => {
    renderForm(businessHours);

    const intervals = screen.getAllByRole('group');
    expect(intervals).toHaveLength(2);

    const firstRangeStarts = screen.getAllByRole('textbox', { name: 'Start time 1' });
    expect(firstRangeStarts[0]).toHaveValue('09:00');
    expect(firstRangeStarts[1]).toHaveValue('10:00');
    expect(screen.getByRole('textbox', { name: 'Start time 2' })).toHaveValue('13:00');
    expect(screen.getByRole('textbox', { name: 'End time 2' })).toHaveValue('17:00');
  });

  it('keeps the other intervals and ranges when one time is changed', async () => {
    const { onSubmit, user } = renderForm(businessHours);

    const firstStartTime = screen.getAllByRole('textbox', { name: 'Start time 1' })[0];
    await user.clear(firstStartTime);
    await user.type(firstStartTime, '08:00');
    await user.click(screen.getByRole('button', { name: 'Update Time Interval' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'business-hours',
      time_intervals: [
        {
          times: [
            { start_time: '08:00', end_time: '12:00' },
            { start_time: '13:00', end_time: '17:00' },
          ],
          weekdays: ['monday:friday'],
          days_of_month: undefined,
          months: undefined,
          years: undefined,
          location: 'Europe/Brussels',
        },
        {
          times: [{ start_time: '10:00', end_time: '14:00' }],
          weekdays: ['saturday', 'sunday'],
          days_of_month: undefined,
          months: undefined,
          years: undefined,
          location: undefined,
        },
      ],
    });
  });

  it('can add a time range to an interval', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByRole('textbox', { name: /^Name/ }), 'nights');
    await user.click(screen.getByRole('button', { name: 'Add time range' }));

    const secondStart = screen.getByRole('textbox', { name: 'Start time 2' });
    await user.clear(secondStart);
    await user.type(secondStart, '22:00');

    await user.click(screen.getByRole('button', { name: 'Create Time Interval' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].time_intervals[0].times).toEqual([
      { start_time: '00:00', end_time: '23:59' },
      { start_time: '22:00', end_time: '23:59' },
    ]);
  });

  it('can add and remove an interval', async () => {
    const { user } = renderForm();

    expect(screen.getAllByRole('group')).toHaveLength(1);
    // A time interval needs at least one interval, so the only one cannot be removed
    expect(screen.queryByRole('button', { name: 'Remove interval' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add interval' }));
    expect(screen.getAllByRole('group')).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Remove interval' })[1]);
    expect(screen.getAllByRole('group')).toHaveLength(1);
  });
});
