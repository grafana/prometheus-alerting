import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import type { Route, TimeInterval } from '@grafana/external-alertmanager/vanilla';
import { setDataSourceSrv } from '@grafana/runtime';

import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMimirAlertmanagerConfig } from '../../../test/handlers/mimir-alertmanager';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { AlertingPermission } from '../../../access-control/abilities';

import { TimeIntervalDrawerView } from './TimeIntervalDrawerView';

const businessHours: TimeInterval = {
  name: 'business-hours',
  time_intervals: [{ times: [{ start_time: '09:00', end_time: '17:00' }], weekdays: ['monday:friday'] }],
};

function configWithRoute(route: Route): ParsedUserConfiguration {
  return {
    template_files: {},
    alertmanager_config: {
      route,
      receivers: [{ name: 'default' }],
      time_intervals: [businessHours],
    },
  };
}

const ui = {
  removeButton: { get: () => screen.getByRole('button', { name: 'Remove' }) },
  inUseAlert: { query: () => screen.queryByText('This time interval is in use') },
  confirmModal: { query: () => screen.queryByRole('dialog') },
};

/**
 * A blocked Remove button carries aria-disabled rather than the disabled attribute: @grafana/ui
 * keeps the element interactive so its tooltip still shows on hover, and drops the click handler
 * instead. Clicking it is asserted separately to prove it really does nothing.
 */
function expectRemoveBlocked() {
  expect(ui.removeButton.get()).toHaveAttribute('aria-disabled', 'true');
}

function renderDrawerView() {
  render(<TimeIntervalDrawerView timeInterval={businessHours} onEdit={vi.fn()} onClose={vi.fn()} />, {
    wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
  });
}

describe('TimeIntervalDrawerView delete guard', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    // The Remove button only renders for a user who may change the Alertmanager configuration
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);
  });

  it('allows removing a time interval no route references', async () => {
    setMimirAlertmanagerConfig(configWithRoute({ receiver: 'default' }));
    renderDrawerView();

    await waitFor(() => expect(ui.removeButton.get()).toBeEnabled());
    expect(ui.inUseAlert.query()).not.toBeInTheDocument();
    expect(ui.removeButton.get()).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('blocks removal and names the route when one uses it as a mute timing', async () => {
    setMimirAlertmanagerConfig(configWithRoute({ receiver: 'default', mute_time_intervals: ['business-hours'] }));
    renderDrawerView();

    await waitFor(() => expect(ui.inUseAlert.query()).toBeInTheDocument());
    expectRemoveBlocked();
    expect(screen.getByText(/default — mute timing/)).toBeInTheDocument();
  });

  it('does not open the confirmation when the blocked Remove button is clicked', async () => {
    const user = userEvent.setup();
    setMimirAlertmanagerConfig(configWithRoute({ receiver: 'default', mute_time_intervals: ['business-hours'] }));
    renderDrawerView();

    await waitFor(() => expect(ui.inUseAlert.query()).toBeInTheDocument());
    await user.click(ui.removeButton.get());

    expect(ui.confirmModal.query()).not.toBeInTheDocument();
  });

  it('blocks removal for a child route that uses it as an active timing', async () => {
    setMimirAlertmanagerConfig(
      configWithRoute({
        receiver: 'default',
        routes: [{ receiver: 'pager', active_time_intervals: ['business-hours'] }],
      })
    );
    renderDrawerView();

    await waitFor(() => expect(ui.inUseAlert.query()).toBeInTheDocument());
    expectRemoveBlocked();
    expect(screen.getByText(/pager — active timing/)).toBeInTheDocument();
  });

  it('describes a route that inherits its receiver rather than leaving it unnamed', async () => {
    setMimirAlertmanagerConfig(
      configWithRoute({
        receiver: 'default',
        routes: [{ mute_time_intervals: ['business-hours'] }],
      })
    );
    renderDrawerView();

    await waitFor(() => expect(ui.inUseAlert.query()).toBeInTheDocument());
    expectRemoveBlocked();
    expect(screen.getByText(/a route that inherits its receiver — mute timing/)).toBeInTheDocument();
  });

  it('leaves removal available for an interval with a similar but different name', async () => {
    setMimirAlertmanagerConfig(
      configWithRoute({ receiver: 'default', mute_time_intervals: ['business-hours-extended'] })
    );
    renderDrawerView();

    await waitFor(() => expect(ui.removeButton.get()).toBeEnabled());
    expect(ui.inUseAlert.query()).not.toBeInTheDocument();
    expect(ui.removeButton.get()).not.toHaveAttribute('aria-disabled', 'true');
  });
});
