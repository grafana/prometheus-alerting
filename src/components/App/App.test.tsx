import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, screen, waitFor } from '@testing-library/react';

import App from './App';
import { testIds } from '../testIds';

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    jest.resetAllMocks();

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
      onNavChanged: jest.fn(),
    } as unknown as AppRootProps;
  });

  test('renders the landing page by default', async () => {
    render(
      <MemoryRouter>
        <App {...props} />
      </MemoryRouter>
    );

    // Application is lazy loaded, so we need to wait for the component to render
    await waitFor(
      () => {
        expect(screen.getByTestId(testIds.landing.container)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
