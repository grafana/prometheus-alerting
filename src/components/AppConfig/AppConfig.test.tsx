import React from 'react';
import { render, screen } from '@testing-library/react';
import { PluginType } from '@grafana/data';
import { vi } from 'vitest';

import AppConfig, { AppConfigProps } from './AppConfig';

// Mock AlertmanagerPicker to avoid Combobox canvas issues
vi.mock('../AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

describe('Components/AppConfig', () => {
  let props: AppConfigProps;

  beforeEach(() => {
    vi.clearAllMocks();

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
});
