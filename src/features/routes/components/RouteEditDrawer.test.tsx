import React from 'react';
import { render, screen } from '@testing-library/react';
import { rs } from '@rstest/core';

import type { RouteEditFormProps } from './RouteEditForm';
import { RouteEditDrawer } from './RouteEditDrawer';

rs.mock('../hooks/useUpdateRoute', () => ({
  useUpdateRoute: () => ({ updateRoute: rs.fn(), isUpdating: false }),
}));

rs.mock('../hooks/useAddRoute', () => ({
  useAddRoute: () => ({ addRoute: rs.fn(), isAdding: false }),
}));

rs.mock('./RouteEditForm', () => ({
  RouteEditForm: ({ isRoot }: RouteEditFormProps) => <div data-testid="route-edit-form">{String(isRoot)}</div>,
}));

describe('RouteEditDrawer', () => {
  it('forwards root route identification to the form', () => {
    render(<RouteEditDrawer route={{ id: 'root', receiver: 'default' }} onClose={rs.fn()} isRoot />);

    expect(screen.getByTestId('route-edit-form')).toHaveTextContent('true');
  });
});
