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
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';
import { keyValueRowsUnder } from '../../../test/utils/keyValueList';
import { AlertingPermission } from '../../../access-control/abilities';

import { attachRouteIds } from '../../routes/utils';
import { routes as routesNav } from '../../../utils/navigation';

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
  confirmModal: { query: () => screen.queryByRole('dialog') },
};

/**
 * A blocked Remove button carries aria-disabled rather than the disabled attribute: @grafana/ui
 * keeps the element interactive so its tooltip still shows on hover, and drops the click handler
 * instead. Clicking it is asserted separately to prove it really does nothing.
 */
/** The "Used by routes" rows as [usage, route] pairs, e.g. ['Mute timing', 'team=ops']. */
function dependentRoutes() {
  return keyValueRowsUnder('Used by routes');
}

function expectRemoveBlocked() {
  expect(ui.removeButton.get()).toHaveAttribute('aria-disabled', 'true');
}

function renderDrawerView() {
  const Wrapper = createTestWrapper(mockMimirAlertmanagerDs.uid);
  // The routes that use the interval are rendered as links, which need a router
  render(
    <Wrapper>
      <TestMemoryRouter>
        <TimeIntervalDrawerView timeInterval={businessHours} onEdit={vi.fn()} onClose={vi.fn()} />
      </TestMemoryRouter>
    </Wrapper>
  );
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

    // Until the routes have loaded there is no telling whether any of them use it
    expectRemoveBlocked();
    await waitFor(() => expect(screen.getByText('No route uses this time interval')).toBeInTheDocument());
    expect(ui.removeButton.get()).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('names a route by its matchers, with a row for each way it uses the interval', async () => {
    setMimirAlertmanagerConfig(
      configWithRoute({
        receiver: 'default',
        routes: [
          {
            receiver: 'pager',
            matchers: ['team=ops'],
            mute_time_intervals: ['business-hours'],
            active_time_intervals: ['business-hours'],
          },
        ],
      })
    );
    renderDrawerView();

    await screen.findByText('Used by routes');
    expectRemoveBlocked();
    expect(dependentRoutes()).toEqual([
      ['Mute timing', 'team=ops'],
      ['Active timing', 'team=ops'],
    ]);
  });

  it('blocks removal and names the route when one uses it as a mute timing', async () => {
    setMimirAlertmanagerConfig(configWithRoute({ receiver: 'default', mute_time_intervals: ['business-hours'] }));
    renderDrawerView();

    await screen.findByText('Used by routes');
    expectRemoveBlocked();
    expect(dependentRoutes()).toEqual([['Mute timing', 'default']]);
  });

  it('does not open the confirmation when the blocked Remove button is clicked', async () => {
    const user = userEvent.setup();
    setMimirAlertmanagerConfig(configWithRoute({ receiver: 'default', mute_time_intervals: ['business-hours'] }));
    renderDrawerView();

    await screen.findByText('Used by routes');
    expectRemoveBlocked();
    await user.click(ui.removeButton.get());

    expect(ui.confirmModal.query()).not.toBeInTheDocument();
  });

  it('blocks removal for a child route that uses it as an active timing, and links to that route', async () => {
    const route: Route = {
      receiver: 'default',
      routes: [{ receiver: 'pager', active_time_intervals: ['business-hours'] }],
    };
    setMimirAlertmanagerConfig(configWithRoute(route));
    renderDrawerView();

    await screen.findByText('Used by routes');
    expectRemoveBlocked();
    expect(dependentRoutes()).toEqual([['Active timing', 'pager']]);

    const childRouteId = attachRouteIds(route).routes![0].id;
    expect(screen.getByRole('link', { name: 'pager' })).toHaveAttribute(
      'href',
      routesNav.listPageLink(mockMimirAlertmanagerDs.uid, childRouteId)
    );
  });

  it('describes a route that inherits its receiver rather than leaving it unnamed', async () => {
    setMimirAlertmanagerConfig(
      configWithRoute({
        receiver: 'default',
        routes: [{ mute_time_intervals: ['business-hours'] }],
      })
    );
    renderDrawerView();

    await screen.findByText('Used by routes');
    expectRemoveBlocked();
    expect(dependentRoutes()).toEqual([['Mute timing', 'A route that inherits its receiver']]);
  });

  it('leaves removal available for an interval with a similar but different name', async () => {
    setMimirAlertmanagerConfig(
      configWithRoute({ receiver: 'default', mute_time_intervals: ['business-hours-extended'] })
    );
    renderDrawerView();

    await waitFor(() => expect(ui.removeButton.get()).not.toHaveAttribute('aria-disabled', 'true'));
  });
});
