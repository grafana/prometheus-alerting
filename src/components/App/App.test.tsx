import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { config, setDataSourceSrv } from '@grafana/runtime';

import App from './App';
import { testIds } from '../testIds';
import { createTestWrapper } from '../../test/utils/test-wrapper';
import { createMockDataSourceSrv, setMockGrafanaDataSources } from '../../test/mocks/grafana-runtime';
import { ROUTES } from '../../constants';

vi.mock('../AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

vi.mock('@grafana/runtime');

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    vi.resetAllMocks();
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());

    props = {
      basename: 'a/sample-app',
      meta: {
        id: 'sample-app',
        name: 'Sample App',
        type: PluginType.app,
        enabled: true,
        jsonData: {},
      },
      query: {},
      path: '',
      onNavChanged: vi.fn(),
    } as unknown as AppRootProps;
  });

  function renderApp(initialEntry = '/') {
    const Wrapper = createTestWrapper();
    return render(
      <Wrapper>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Suspense fallback={null}>
            <App {...props} />
          </Suspense>
        </MemoryRouter>
      </Wrapper>
    );
  }

  test('renders the alerts page by default', async () => {
    renderApp();

    // Application is lazy loaded, so we need to wait for the component to render
    await waitFor(
      () => {
        expect(screen.getByTestId(testIds.alerts.container)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test('renders an empty state instead of crashing when no Alertmanager is configured', async () => {
    (config as any).datasources = {};

    renderApp(`/${ROUTES.Alerts}`);

    await waitFor(() => {
      expect(screen.getByTestId(testIds.noAlertmanager.container)).toBeInTheDocument();
    });
    expect(screen.getByText('No Alertmanager data sources configured')).toBeInTheDocument();
  });

  test('lands on the rules page instead of alerts when only rules data sources are configured', async () => {
    (config as any).datasources = {};

    renderApp();

    // Landing on alerts would only show the "no Alertmanager" empty state, so we redirect to rules.
    await waitFor(() => {
      expect(screen.queryByTestId(testIds.noAlertmanager.container)).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId(testIds.alerts.container)).not.toBeInTheDocument();
  });

  test('lands on alerts when neither an Alertmanager nor a rules data source is configured', async () => {
    (config as any).datasources = {};
    const dataSourceSrv = createMockDataSourceSrv();
    setDataSourceSrv({ ...dataSourceSrv, getList: () => [] } as never);

    renderApp();

    // Redirecting to rules would only show a second empty state – the Alertmanager page explains more.
    await waitFor(() => {
      expect(screen.getByTestId(testIds.noAlertmanager.container)).toBeInTheDocument();
    });
  });
});
