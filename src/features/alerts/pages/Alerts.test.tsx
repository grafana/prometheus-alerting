import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import { server } from '../../../test/server';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { testIds } from '../../../components/testIds';
import Alerts from './Alerts';

vi.mock('../../../components/AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

vi.mock('@grafana/runtime');

describe('Alerts page', () => {
  test('renders the alerts container', async () => {
    server.use(
      http.get('/api/datasources/proxy/uid/:uid/api/v2/alerts/groups', () =>
        HttpResponse.json([])
      )
    );

    render(<Alerts />, { wrapper: createTestWrapper('alertmanager-1') });

    await waitFor(() => {
      expect(screen.getByTestId(testIds.alerts.container)).toBeInTheDocument();
    });
  });
});
