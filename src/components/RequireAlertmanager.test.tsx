import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { config } from '@grafana/runtime';
import type { ComboboxOption } from '@grafana/ui';

import { AlertmanagerPicker } from './AlertmanagerPicker/AlertmanagerPicker';
import { RequireAlertmanager } from './RequireAlertmanager';
import { testIds } from './testIds';
import { STORAGE_KEYS } from '../constants';
import { useAlertmanager } from '../hooks/useAlertmanager';
import { mockAlertmanagerDs, mockMimirAlertmanagerDs } from '../test/fixtures/datasources';
import { mockMimirDs, mockPrometheusDs, setMockGrafanaDataSources } from '../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../test/utils/test-wrapper';

vi.mock('@grafana/runtime');
/** The props AlertmanagerPicker passes to Combobox. */
interface FakeComboboxProps {
  options: Array<ComboboxOption<string>>;
  value?: ComboboxOption<string>;
  onChange: (option: ComboboxOption<string>) => void;
}

// Combobox doesn't render its options in jsdom, so the picker gets a plain <select> in its place.
vi.mock('@grafana/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@grafana/ui')>()),
  Combobox: ({ options, value, onChange }: FakeComboboxProps) => (
    <select
      value={value?.value}
      onChange={(event) => onChange(options.find((option) => option.value === event.target.value)!)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

// Every Alertmanager the guarded page has rendered against, in order.
const renderedWith = vi.fn();

/** Shows which Alertmanager the guarded page ended up on, and what the URL looks like by then. */
function GuardedPage() {
  const { uid } = useAlertmanager();
  const { search } = useLocation();
  renderedWith(uid);

  return (
    <div data-testid="guarded-page">
      <AlertmanagerPicker />
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
    renderedWith.mockClear();
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

  it('switches to the Alertmanager named in ?alertmanager= and keeps it in the URL', () => {
    renderGuardedRoute(`/guarded?alertmanager=${mockMimirAlertmanagerDs.uid}&silenceIds=abc`);

    expect(screen.getByTestId('selected-alertmanager')).toHaveTextContent(mockMimirAlertmanagerDs.uid);
    expect(sessionStorage.getItem(STORAGE_KEYS.SELECTED_ALERTMANAGER_UID)).toBe(mockMimirAlertmanagerDs.uid);
    // Kept, so the address bar can be shared as it is.
    expect(screen.getByTestId('search')).toHaveTextContent(
      `?alertmanager=${mockMimirAlertmanagerDs.uid}&silenceIds=abc`
    );
    // The page waits for the switch, so it never starts loading the other Alertmanager's data.
    expect(renderedWith).not.toHaveBeenCalledWith(mockAlertmanagerDs.uid);
  });

  it('swaps an Alertmanager name in ?alertmanager= for its UID', () => {
    renderGuardedRoute(`/guarded?${new URLSearchParams({ alertmanager: mockMimirAlertmanagerDs.name })}`);

    expect(screen.getByTestId('selected-alertmanager')).toHaveTextContent(mockMimirAlertmanagerDs.uid);
    expect(screen.getByTestId('search')).toHaveTextContent(`?alertmanager=${mockMimirAlertmanagerDs.uid}`);
  });

  it('drops an ?alertmanager= that does not match any Alertmanager', async () => {
    renderGuardedRoute('/guarded?alertmanager=does-not-exist&silenceIds=abc');

    expect(screen.getByTestId('selected-alertmanager')).toHaveTextContent(mockAlertmanagerDs.uid);
    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^\?silenceIds=abc$/));
  });

  it('drops ?alertmanager= instead of switching back when the user picks another Alertmanager', async () => {
    const user = userEvent.setup();
    renderGuardedRoute(`/guarded?alertmanager=${mockMimirAlertmanagerDs.uid}`);

    await user.selectOptions(screen.getByRole('combobox'), mockAlertmanagerDs.uid);

    await waitFor(() => expect(screen.getByTestId('search')).toBeEmptyDOMElement());
    expect(screen.getByTestId('selected-alertmanager')).toHaveTextContent(mockAlertmanagerDs.uid);
  });
});
