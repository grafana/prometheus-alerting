import React from 'react';
import { render, screen } from '@testing-library/react';

import { TimeIntervalMutationUnavailable } from './TimeIntervalMutationUnavailable';

describe('TimeIntervalMutationUnavailable', () => {
  it('renders unsupported feedback', () => {
    render(<TimeIntervalMutationUnavailable />);

    expect(screen.getByText('Configuration changes unavailable')).toBeInTheDocument();
    expect(screen.getByText('This Alertmanager does not support updating time intervals.')).toBeInTheDocument();
  });
});
