import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { ParsedUserConfiguration, RouteWithID } from '@grafana/external-alertmanager/mimir';
import { setDataSourceSrv } from '@grafana/runtime';

import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMimirAlertmanagerConfig } from '../../../test/handlers/mimir-alertmanager';
import { createMockDataSourceSrv, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { RouteEditForm } from './RouteEditForm';

const config: ParsedUserConfiguration = {
  template_files: {},
  alertmanager_config: {
    route: { receiver: 'default' },
    receivers: [{ name: 'default' }],
    time_intervals: [
      {
        name: 'business-hours',
        time_intervals: [
          {
            times: [{ start_time: '09:00', end_time: '17:00' }],
            weekdays: ['monday:friday'],
          },
        ],
      },
      {
        name: 'holidays',
        time_intervals: [{ months: ['december'] }],
      },
    ],
  },
};

function renderForm(route: RouteWithID, onSubmit = vi.fn(), isRoot = false) {
  render(<RouteEditForm route={route} onSubmit={onSubmit} onCancel={vi.fn()} isRoot={isRoot} />, {
    wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
  });

  return { onSubmit };
}

describe('RouteEditForm timing fields', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setMimirAlertmanagerConfig(config);
  });

  it('hides timing selectors and omits timing values when submitting the root route', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm(
      {
        id: 'root-route',
        receiver: 'default',
        active_time_intervals: ['business-hours'],
        mute_time_intervals: ['holidays'],
      },
      vi.fn(),
      true
    );

    expect(screen.queryByRole('combobox', { name: /^Mute timings/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: /^Active timings/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Timing behavior' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    const submittedValues = onSubmit.mock.calls[0][0];
    expect(submittedValues).not.toHaveProperty('muteTimeIntervals');
    expect(submittedValues).not.toHaveProperty('activeTimeIntervals');
  });

  it('allows configured intervals to be selected in both timing selectors', async () => {
    const user = userEvent.setup();
    renderForm({ id: 'route-1', receiver: 'default', active_time_intervals: ['business-hours'] });

    await screen.findByText('09:00–17:00');

    const muteTimings = screen.getByRole('combobox', { name: /^Mute timings/ });
    await user.click(muteTimings);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    const activeTimings = screen.getByRole('combobox', { name: /^Active timings/ });
    await user.click(activeTimings);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    expect(screen.getAllByText('december')).toHaveLength(2);
  });

  it('shows existing active and mute selections with their effective behavior', async () => {
    renderForm({
      id: 'route-1',
      receiver: 'default',
      active_time_intervals: ['business-hours'],
      mute_time_intervals: ['holidays'],
    });

    expect(
      await screen.findByText(
        'Both conditions apply: notifications are sent only when at least one active timing matches and no mute timing matches.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('09:00–17:00')).toBeInTheDocument();
    expect(screen.getByText('december')).toBeInTheDocument();
  });

  it('submits selected active and mute timing names', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      id: 'route-1',
      receiver: 'default',
      active_time_intervals: ['business-hours'],
    });

    await screen.findByText('09:00–17:00');

    const muteTimings = screen.getByRole('combobox', { name: /^Mute timings/ });
    await user.click(muteTimings);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          muteTimeIntervals: ['holidays'],
          activeTimeIntervals: ['business-hours'],
        })
      );
    });
  });

  it('does not create arbitrary timing names', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({
      id: 'route-1',
      receiver: 'default',
      active_time_intervals: ['business-hours'],
    });

    await screen.findByText('09:00–17:00');

    const muteTimings = screen.getByRole('combobox', { name: /^Mute timings/ });
    await user.click(muteTimings);
    await user.type(muteTimings, 'missing-interval');
    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          muteTimeIntervals: [],
        })
      );
    });
  });
});
