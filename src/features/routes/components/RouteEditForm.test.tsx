import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { ParsedUserConfiguration, RouteWithID } from '@grafana/external-alertmanager/mimir';
import { setDataSourceSrv } from '@grafana/runtime';

import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMimirAlertmanagerConfig } from '../../../test/handlers/mimir-alertmanager';
import { createMockDataSourceSrv, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { RouteEditForm } from './RouteEditForm';
import { type FormAmRoute } from '../types';

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

const ui = {
  muteTimingsCombo: {
    get: () => screen.getByRole('combobox', { name: /^Mute timings/ }),
    query: () => screen.queryByRole('combobox', { name: /^Mute timings/ }),
  },
  activeTimingsCombo: {
    get: () => screen.getByRole('combobox', { name: /^Active timings/ }),
    query: () => screen.queryByRole('combobox', { name: /^Active timings/ }),
  },
  timingBehaviorHeading: {
    query: () => screen.queryByRole('heading', { name: 'Timing behavior' }),
  },
  saveButton: {
    get: () => screen.getByRole('button', { name: 'Save' }),
  },
};

function renderForm(route: RouteWithID, isRoot = false) {
  let resolveSubmission: (data: Partial<FormAmRoute>) => void = () => undefined;
  const submission = new Promise<Partial<FormAmRoute>>((resolve) => {
    resolveSubmission = resolve;
  });

  render(<RouteEditForm route={route} onSubmit={resolveSubmission} onCancel={vi.fn()} isRoot={isRoot} />, {
    wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
  });

  return { submission };
}

describe('RouteEditForm matcher fields', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setMimirAlertmanagerConfig(config);
  });

  it('preserves existing matchers and adds another matcher', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm({ id: 'route-1', receiver: 'default', matchers: ['severity=critical'] });

    expect(screen.getByRole('textbox', { name: 'Label' })).toHaveValue('severity');
    expect(screen.getByRole('textbox', { name: 'Value' })).toHaveValue('critical');
    expect(screen.getByRole('textbox', { name: 'Value' }).tagName).toBe('INPUT');

    await user.click(screen.getByRole('button', { name: 'Add matcher' }));
    const labels = screen.getAllByRole('textbox', { name: 'Label' });
    const values = screen.getAllByRole('textbox', { name: 'Value' });
    await user.type(labels[1], 'team');
    await user.type(values[1], 'platform');
    await user.click(ui.saveButton.get());

    expect((await submission).object_matchers).toEqual([
      { name: 'severity', operator: '=', value: 'critical' },
      { name: 'team', operator: '=', value: 'platform' },
    ]);
  });

  it('retains a non-equality operator around a removed middle matcher', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm({
      id: 'route-1',
      receiver: 'default',
      matchers: ['first=one', 'middle=two', 'last=~three'],
    });
    await user.click(screen.getAllByRole('button', { name: 'Remove matcher' })[1]);
    await user.click(ui.saveButton.get());

    expect((await submission).object_matchers).toEqual([
      { name: 'first', operator: '=', value: 'one' },
      { name: 'last', operator: '=~', value: 'three' },
    ]);
  });

  it('allows all route matchers to be removed', async () => {
    const user = userEvent.setup();
    renderForm({ id: 'route-1', receiver: 'default', matchers: ['severity=critical'] });

    await user.click(screen.getByRole('button', { name: 'Remove matcher' }));

    expect(screen.queryByRole('textbox', { name: 'Label' })).not.toBeInTheDocument();
    expect(
      screen.getByText('If no matchers are specified, this route will handle all alert instances.')
    ).toBeInTheDocument();
  });
});

describe('RouteEditForm timing fields', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setMimirAlertmanagerConfig(config);
  });

  it('hides timing selectors and omits timing values when submitting the root route', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm(
      {
        id: 'root-route',
        receiver: 'default',
        active_time_intervals: ['business-hours'],
        mute_time_intervals: ['holidays'],
      },
      true
    );

    expect(ui.muteTimingsCombo.query()).not.toBeInTheDocument();
    expect(ui.activeTimingsCombo.query()).not.toBeInTheDocument();
    expect(ui.timingBehaviorHeading.query()).not.toBeInTheDocument();

    await user.click(ui.saveButton.get());

    const submittedValues = await submission;
    expect(submittedValues).not.toHaveProperty('muteTimeIntervals');
    expect(submittedValues).not.toHaveProperty('activeTimeIntervals');
  });

  it('allows configured intervals to be selected in both timing selectors', async () => {
    const user = userEvent.setup();
    renderForm({ id: 'route-1', receiver: 'default', active_time_intervals: ['business-hours'] });

    await screen.findByText('09:00–17:00');

    const muteTimings = ui.muteTimingsCombo.get();
    await user.click(muteTimings);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    const activeTimings = ui.activeTimingsCombo.get();
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
    const { submission } = renderForm({
      id: 'route-1',
      receiver: 'default',
      active_time_intervals: ['business-hours'],
    });

    await screen.findByText('09:00–17:00');

    const muteTimings = ui.muteTimingsCombo.get();
    await user.click(muteTimings);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

    await user.click(ui.saveButton.get());

    expect(await submission).toMatchObject({
      muteTimeIntervals: ['holidays'],
      activeTimeIntervals: ['business-hours'],
    });
  });

  it('does not create arbitrary timing names', async () => {
    const user = userEvent.setup();
    const { submission } = renderForm({
      id: 'route-1',
      receiver: 'default',
      active_time_intervals: ['business-hours'],
    });

    await screen.findByText('09:00–17:00');

    const muteTimings = ui.muteTimingsCombo.get();
    await user.click(muteTimings);
    await user.type(muteTimings, 'missing-interval');
    await user.keyboard('{Enter}');
    await user.click(ui.saveButton.get());

    expect((await submission).muteTimeIntervals).toEqual([]);
  });
});
