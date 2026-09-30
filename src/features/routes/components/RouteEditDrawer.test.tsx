import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import type { RouteEditFormProps } from './RouteEditForm';
import { RouteEditDrawer } from './RouteEditDrawer';

vi.mock('../hooks/useUpdateRoute', () => ({
  useUpdateRoute: () => ({ updateRoute: vi.fn(), isUpdating: false }),
}));

vi.mock('../hooks/useAddRoute', () => ({
  useAddRoute: () => ({ addRoute: vi.fn(), isAdding: false }),
}));

vi.mock('./RouteEditForm', () => ({
  RouteEditForm: ({ isRoot }: RouteEditFormProps) => <div data-testid="route-edit-form">{String(isRoot)}</div>,
}));

describe('RouteEditDrawer', () => {
  it('forwards root route identification to the form', () => {
    render(<RouteEditDrawer route={{ id: 'root', receiver: 'default' }} onClose={vi.fn()} isRoot />);

    expect(screen.getByTestId('route-edit-form')).toHaveTextContent('true');
  });
});
