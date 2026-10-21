import React from 'react';
import { render, screen } from '@testing-library/react';
import { PluginType } from '@grafana/data';
import { setDataSourceSrv } from '@grafana/runtime';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';

import AppConfig, { AppConfigProps } from './AppConfig';
import {
  createMockDataSourceSrv,
  mockAlertmanagerDs,
  setMockGrafanaDataSources,
} from '../../test/mocks/grafana-runtime';
import { server } from '../../test/server';
import { sharedStore } from '../../store/store';
import { alertmanagerApi } from '../../api/alertmanager/alertmanager.endpoints';

// Mock AlertmanagerPicker to avoid Combobox canvas issues
vi.mock('../AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

describe('Components/AppConfig', () => {
  let props: AppConfigProps;

  beforeEach(() => {
    vi.clearAllMocks();
    // The status fieldset dispatches an RTK Query request that resolves the data source's
    // proxy path, which needs a data source service to look up the data source by UID.
    setDataSourceSrv(createMockDataSourceSrv());

    props = {
      plugin: {
        meta: {
          id: 'sample-app',
          name: 'Sample App',
          type: PluginType.app,
          enabled: true,
          jsonData: {},
        },
      },
      query: {},
    } as unknown as AppConfigProps;
  });

  test('renders the Alertmanager selection fieldset', () => {
    const plugin = { meta: { ...props.plugin.meta, enabled: false } };

    // @ts-ignore - We don't need to provide `addConfigPage()` and `setChannelSupport()` for these tests
    render(<AppConfig plugin={plugin} query={props.query} />);

    expect(screen.queryByRole('group', { name: /alertmanager/i })).toBeInTheDocument();
    expect(screen.getByTestId('alertmanager-picker')).toBeInTheDocument();
  });

  test('shows warning when no alertmanager is configured', () => {
    // @ts-ignore
    render(<AppConfig plugin={props.plugin} query={props.query} />);

    // When no alertmanager is selected, should show the warning
    expect(screen.getByText(/no alertmanager configured/i)).toBeInTheDocument();
  });

  test('shows the HTTP status and data source name when loading the status fails', async () => {
    setMockGrafanaDataSources();
    sharedStore.dispatch(alertmanagerApi.util.resetApiState());
    // Vanilla and Mimir Alertmanagers expose the status endpoint under different proxy paths.
    const badGateway = () => HttpResponse.json({ message: 'bad gateway' }, { status: 502 });
    server.use(
      http.get('/api/datasources/proxy/uid/:uid/api/v2/status', badGateway),
      http.get('/api/datasources/proxy/uid/:uid/alertmanager/api/v2/status', badGateway)
    );

    // @ts-ignore
    render(<AppConfig plugin={props.plugin} query={props.query} />);

    expect(await screen.findByText('Error loading Alertmanager status')).toBeInTheDocument();
    expect(screen.getByText(/502/)).toBeInTheDocument();
    expect(screen.getByText(`Data source: ${mockAlertmanagerDs.name}`)).toBeInTheDocument();
  });
});
