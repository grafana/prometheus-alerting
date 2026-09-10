import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ParsedUserConfiguration } from '@grafana/external-alertmanager/mimir';
import { setDataSourceSrv } from '@grafana/runtime';

import { AlertingPermission } from '../../../access-control/abilities';
import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMimirAlertmanagerConfig } from '../../../test/handlers/mimir-alertmanager';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import TimeIntervalsPage from './TimeIntervalsList';

const timeIntervals = Array.from({ length: 41 }, (_, index) => ({
  name: `interval-${index + 1}`,
  time_intervals: [{ weekdays: ['monday'] }],
}));

function renderPage() {
  const config: ParsedUserConfiguration = {
    template_files: {},
    alertmanager_config: {
      route: { receiver: 'default' },
      receivers: [{ name: 'default' }],
      time_intervals: timeIntervals,
    },
  };
  setMimirAlertmanagerConfig(config);

  return render(<TimeIntervalsPage />, { wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid) });
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
});
