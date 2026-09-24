import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { config } from '@grafana/runtime';

import { RequireAlertmanager } from './RequireAlertmanager';
import { testIds } from './testIds';
import { STORAGE_KEYS } from '../constants';
import { useAlertmanager } from '../hooks/useAlertmanager';
import { mockAlertmanagerDs, mockMimirAlertmanagerDs } from '../test/fixtures/datasources';
import { mockMimirDs, mockPrometheusDs, setMockGrafanaDataSources } from '../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../test/utils/test-wrapper';

vi.mock('@grafana/runtime');

/** Shows which Alertmanager the guarded page ended up on, and what the URL looks like by then. */
function GuardedPage() {
  const { uid } = useAlertmanager();
  const { search } = useLocation();

  return (
    <div data-testid="guarded-page">
      <span data-testid="selected-alertmanager">{uid}</span>
      <span data-testid="search">{search}</span>
    </div>
  );
}

function renderGuardedRoute(initialEntry = '/guarded') {
  // Start on the vanilla Alertmanager, so a link naming the Mimir one has something to switch away from.
  const Wrapper = createTestWrapper(mockAlertmanagerDs.uid);

  return render(
    <Wrapper>
      <TestMemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<RequireAlertmanager />}>
            <Route path="/guarded" element={<GuardedPage />} />
          </Route>
        </Routes>
      </TestMemoryRouter>
    </Wrapper>
  );
}

describe('RequireAlertmanager', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    sessionStorage.clear();
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

  it('switches to the Alertmanager named in ?alertmanager= and takes the param out of the URL', () => {
    renderGuardedRoute(`/guarded?alertmanager=${mockMimirAlertmanagerDs.uid}&silenceIds=abc`);

    expect(screen.getByTestId('selected-alertmanager')).toHaveTextContent(mockMimirAlertmanagerDs.uid);
    expect(sessionStorage.getItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID)).toBe(mockMimirAlertmanagerDs.uid);
    // Everything else the link carried is still there for the page to read.
    expect(screen.getByTestId('search')).toHaveTextContent(/^\?silenceIds=abc$/);
  });

  it('ignores an ?alertmanager= that does not match any Alertmanager', () => {
    renderGuardedRoute('/guarded?alertmanager=does-not-exist');

    expect(screen.getByTestId('selected-alertmanager')).toHaveTextContent(mockAlertmanagerDs.uid);
    expect(screen.getByTestId('search')).toHaveTextContent('?alertmanager=does-not-exist');
  });
});
