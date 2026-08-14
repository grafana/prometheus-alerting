import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { config } from '@grafana/runtime';

import { RequireAlertmanager } from './RequireAlertmanager';
import { testIds } from './testIds';
import { mockMimirDs, mockPrometheusDs, setMockGrafanaDataSources } from '../test/mocks/grafana-runtime';
import { TestMemoryRouter } from '../test/utils/test-wrapper';

vi.mock('@grafana/runtime');

function renderGuardedRoute() {
  return render(
    <TestMemoryRouter initialEntries={['/guarded']}>
      <Routes>
        <Route element={<RequireAlertmanager />}>
          <Route path="/guarded" element={<div data-testid="guarded-page" />} />
        </Route>
      </Routes>
    </TestMemoryRouter>
  );
}

describe('RequireAlertmanager', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
  });

  it('renders the nested route when an Alertmanager is configured', () => {
    renderGuardedRoute();

    expect(screen.getByTestId('guarded-page')).toBeInTheDocument();
    expect(screen.queryByTestId(testIds.noAlertmanager.container)).not.toBeInTheDocument();
  });

  it('renders the empty state when no Alertmanager is configured', () => {
    // Only non-Alertmanager data sources – rules still work, notification pages do not.
    (config as any).datasources = { [mockPrometheusDs.uid]: mockPrometheusDs, [mockMimirDs.uid]: mockMimirDs };

    renderGuardedRoute();

    expect(screen.getByTestId(testIds.noAlertmanager.container)).toBeInTheDocument();
    expect(screen.queryByTestId('guarded-page')).not.toBeInTheDocument();
  });
});
