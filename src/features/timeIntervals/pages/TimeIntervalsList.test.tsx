import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

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
import { timeIntervals as timeIntervalsNav } from '../../../utils/navigation';
import TimeIntervalsPage from './TimeIntervalsList';

const timeIntervals = Array.from({ length: 41 }, (_, index) => ({
  name: `interval-${index + 1}`,
  time_intervals: [{ weekdays: ['monday'] }],
}));

function CurrentSearch() {
  return <div data-testid="current-search">{useLocation().search}</div>;
}

// The page is mounted at "/", so a link's path is dropped and only its query string kept
function pathFor(name: string) {
  return `/?${timeIntervalsNav.listPageLink(mockMimirAlertmanagerDs.uid, name).split('?')[1]}`;
}

function renderPage(route: Route = { receiver: 'default' }, path = '/') {
  const config: ParsedUserConfiguration = {
    template_files: {},
    alertmanager_config: {
      route,
      receivers: [{ name: 'default' }],
      time_intervals: timeIntervals,
    },
  };
  setMimirAlertmanagerConfig(config);

  const Wrapper = createTestWrapper(mockMimirAlertmanagerDs.uid);
  return render(
    <Wrapper>
      <TestMemoryRouter initialEntries={[path]}>
        <TimeIntervalsPage />
        <CurrentSearch />
      </TestMemoryRouter>
    </Wrapper>
  );
}

describe('TimeIntervalsPage', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);
  });

  it('paginates interval cards and opens the real interval drawer', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'interval-1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'interval-41' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'next page' }));

    expect(screen.queryByRole('heading', { name: 'interval-1' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'interval-41' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View' }));

    expect(screen.getByText('Time Interval')).toBeInTheDocument();
    expect(screen.getAllByText('interval-41')).toHaveLength(2);
  });

  it('searches all intervals, resets pagination, and shows an empty result', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByRole('heading', { name: 'interval-1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'next page' }));

    const search = screen.getByRole('textbox', { name: 'Search time intervals by name' });
    await user.type(search, 'INTERVAL-1');

    expect(screen.getByRole('heading', { name: 'interval-1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'interval-41' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'next page' })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'missing');

    await waitFor(() => expect(screen.getByText('No time intervals match your search.')).toBeInTheDocument());
  });

  it('shows on each card how many routes use the interval', async () => {
    renderPage({
      receiver: 'default',
      mute_time_intervals: ['interval-1'],
      routes: [{ receiver: 'pager', active_time_intervals: ['interval-1', 'interval-2'] }],
    });

    // Tests render the default (singular) text; the plural comes from the translation file
    const card = async (name: string) => (await screen.findByRole('heading', { name })).parentElement!;

    expect(await card('interval-1')).toHaveTextContent(/Used by 2 route/);
    expect(await card('interval-2')).toHaveTextContent(/Used by 1 route/);
    expect(await card('interval-3')).toHaveTextContent('No route uses this time interval');
  });

  it('opens the drawer for the interval named in the URL, even when it is not on the first page', async () => {
    renderPage(undefined, pathFor('interval-41'));

    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByText('interval-41')).toBeInTheDocument();
    expect(screen.getByTestId('current-search')).toHaveTextContent('name=interval-41');
  });

  it('puts the viewed interval in the URL, and takes it out again when the drawer closes', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByRole('heading', { name: 'interval-1' });
    await user.click(screen.getAllByRole('button', { name: 'View' })[0]);

    const drawer = await screen.findByRole('dialog');
    expect(screen.getByTestId('current-search')).toHaveTextContent('name=interval-1');
    expect(screen.getByTestId('current-search')).toHaveTextContent(`alertmanager=${mockMimirAlertmanagerDs.uid}`);

    await user.click(within(drawer).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('current-search')).toBeEmptyDOMElement();
  });

  it('opens nothing for a name that no longer matches an interval', async () => {
    renderPage(undefined, pathFor('renamed-since'));

    await waitFor(() => expect(screen.getByTestId('current-search')).toBeEmptyDOMElement());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
