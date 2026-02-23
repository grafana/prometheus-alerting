import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import Alerts from './Alerts';
import { testIds } from '../../../components/testIds';

vi.mock('../../../components/AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

vi.mock('@grafana/runtime', async () => ({
  ...(await vi.importActual('@grafana/runtime')),
  PluginPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('Alerts page', () => {
  test('renders the alerts container', () => {
    render(<Alerts />);
    expect(screen.getByTestId(testIds.alerts.container)).toBeInTheDocument();
  });
});
