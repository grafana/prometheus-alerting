import React, { Suspense } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import App from './App';
import { testIds } from '../testIds';
import { createTestWrapper } from '../../test/utils/test-wrapper';

vi.mock('../AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

vi.mock('@grafana/runtime');

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    vi.resetAllMocks();

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

  test('renders the alerts page by default', async () => {
    const Wrapper = createTestWrapper();
    render(
      <Wrapper>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={null}>
            <App {...props} />
          </Suspense>
        </MemoryRouter>
      </Wrapper>
    );

    // Application is lazy loaded, so we need to wait for the component to render
    await waitFor(
      () => {
        expect(screen.getByTestId(testIds.alerts.container)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
