import React from 'react';
import { render, screen } from '@testing-library/react';

import { AlertmanagerError } from './AlertmanagerError';

describe('AlertmanagerError', () => {
  it('renders permission feedback for forbidden reads', () => {
    render(<AlertmanagerError error={{ status: 403, data: { message: 'Forbidden' } }} title="Could not load" />);

    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(screen.queryByText(/403/)).not.toBeInTheDocument();
  });
});
