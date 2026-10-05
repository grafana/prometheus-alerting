import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { rs } from '@rstest/core';

import { setDataSourceSrv } from '@grafana/runtime';

import { server } from '../../../test/server';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { testIds } from '../../../components/testIds';
import Alerts from './Alerts';

rs.mock('../../../components/AlertmanagerPicker/AlertmanagerPicker', () => ({
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
});
