import React from 'react';
import { render, screen } from '@testing-library/react';

import { RoutesError } from './RoutesError';

describe('RoutesError', () => {
  it('shows permission feedback for a forbidden datasource request', () => {
    render(<RoutesError error={{ status: 403, data: {} }} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You do not have the required permissions to access this page.'
    );
  });
});
