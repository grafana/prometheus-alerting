import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import type { Route } from '@grafana/external-alertmanager/vanilla';
import { setDataSourceSrv } from '@grafana/runtime';

import { AlertingPermission } from '../../../access-control/abilities';
import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMimirAlertmanagerConfig } from '../../../test/handlers/mimir-alertmanager';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';
import { routes as routesNav, timeIntervals as timeIntervalsNav } from '../../../utils/navigation';
import { attachRouteIds } from '../utils';
import RoutesPage from './RoutesList';

// @grafana/ui/unstable also pulls in the Table module tree, which needs the `uwrap` package the
// test runner can't load. RouteCard only uses it for the loading skeleton, so attach it by hand.
vi.mock('@grafana/ui/unstable', () => ({
  attachSkeleton: (Component: React.ComponentType<unknown>, Skeleton: React.ComponentType<unknown>) =>
    Object.assign(Component, { Skeleton }),
}));

vi.mock('../../../components/AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

const route: Route = {
  receiver: 'default',
  routes: [
    {
      receiver: 'pager',
      matchers: ['severity=critical'],
      mute_time_intervals: ['weekends'],
      active_time_intervals: ['business-hours', 'on-call'],
    },
  ],
};

const config: ParsedUserConfiguration = {
  template_files: {},
  alertmanager_config: {
    route,
    receivers: [{ name: 'default' }, { name: 'pager' }],
    time_intervals: [{ name: 'weekends' }, { name: 'business-hours' }, { name: 'on-call' }],
  },
};

// The routes page is mounted at "/", so the link's path is dropped and only its query string kept
function pathFor(routeId: string) {
  return `/?${routesNav.listPageLink(mockMimirAlertmanagerDs.uid, routeId).split('?')[1]}`;
}

function CurrentSearch() {
  return <div data-testid="current-search">{useLocation().search}</div>;
}

function renderRoutes(path: string) {
  const Wrapper = createTestWrapper(mockMimirAlertmanagerDs.uid);
  return render(
    <Wrapper>
      <TestMemoryRouter initialEntries={[path]}>
        <RoutesPage />
        <CurrentSearch />
      </TestMemoryRouter>
    </Wrapper>
  );
}

describe('RoutesPage routeId parameter', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.NotificationsRead);
    setMimirAlertmanagerConfig(config);
  });

  const childRouteId = attachRouteIds(route).routes![0].id;
  const ui = {
    currentSearch: () => screen.getByTestId('current-search'),
  };

  it('opens the drawer for the route named in the URL, with its time intervals, and keeps the link', async () => {
    renderRoutes(pathFor(childRouteId));

    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('severity=critical')).toBeInTheDocument();
    for (const name of ['weekends', 'business-hours', 'on-call']) {
      expect(within(drawer).getByRole('link', { name })).toHaveAttribute(
        'href',
        timeIntervalsNav.listPageLink(mockMimirAlertmanagerDs.uid, name)
      );
    }
    expect(ui.currentSearch()).toHaveTextContent(`routeId=${childRouteId}`);
  });

  it('puts the clicked route in the URL, and takes it out again when the drawer closes', async () => {
    const user = userEvent.setup();
    renderRoutes('/');

    const [childRouteCard] = await screen.findAllByTestId('am-route-container');
    await user.click(childRouteCard);

    const drawer = await screen.findByRole('dialog');
    expect(ui.currentSearch()).toHaveTextContent(`routeId=${childRouteId}`);
    expect(ui.currentSearch()).toHaveTextContent(`alertmanager=${mockMimirAlertmanagerDs.uid}`);

    await user.click(within(drawer).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(ui.currentSearch()).toBeEmptyDOMElement();
  });

  it('keeps the route in the URL while its receiver is open, so "Back to route" returns to it', async () => {
    const user = userEvent.setup();
    renderRoutes(pathFor(childRouteId));

    const drawer = await screen.findByRole('dialog');
    await user.click(within(drawer).getByRole('link', { name: 'pager' }));
    expect(ui.currentSearch()).toHaveTextContent(`routeId=${childRouteId}`);

    await user.click(await screen.findByRole('button', { name: 'Back to route' }));
    expect(screen.queryByRole('button', { name: 'Back to route' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('severity=critical')).toBeInTheDocument();
  });

  it('opens nothing for an ID that no longer matches a route', async () => {
    renderRoutes(pathFor('0-stale'));

    await waitFor(() => expect(ui.currentSearch()).toBeEmptyDOMElement());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
