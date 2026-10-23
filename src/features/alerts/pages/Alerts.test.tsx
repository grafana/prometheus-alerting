import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';

import { server } from '../../../test/server';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { createMockDataSourceSrv, setMockGrafanaDataSources } from '../../../test/mocks/grafana-runtime';
import { testIds } from '../../../components/testIds';
import { AlertGroupFactory } from '../mocks/alerts.fakes';
import Alerts from './Alerts';

vi.mock('../../../components/AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

describe('Alerts page', () => {
  test('renders the alerts container', async () => {
    server.use(http.get('/api/datasources/proxy/uid/:uid/api/v2/alerts/groups', () => HttpResponse.json([])));

    // The alert groups endpoint resolves the data source's proxy path via the data
    // source service, which needs a data source to look up by UID.
    setDataSourceSrv(createMockDataSourceSrv());

    render(<Alerts />, { wrapper: createTestWrapper('alertmanager-1') });

    await waitFor(() => {
      expect(screen.getByTestId(testIds.alerts.container)).toBeInTheDocument();
    });
  });

  test('offers to clear filters when they hide every alert', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/datasources/proxy/uid/:uid/api/v2/alerts/groups', () =>
        HttpResponse.json([AlertGroupFactory.build()])
      )
    );
    setDataSourceSrv(createMockDataSourceSrv());
    setMockGrafanaDataSources();

    render(<Alerts />, { wrapper: createTestWrapper('alertmanager-1') });

    await user.click(await screen.findByLabelText('Active'));
    expect(await screen.findByText('No alerts match the current filters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.queryByText('No alerts match the current filters')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Active')).toBeChecked();
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });
});
