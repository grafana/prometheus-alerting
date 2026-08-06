import React from 'react';
import { render, screen } from '@testing-library/react';

import { MutationUnavailable } from './MutationUnavailable';

describe('MutationUnavailable', () => {
  it('renders unsupported feedback for the requested resource', () => {
    render(<MutationUnavailable resource="time intervals" />);

    expect(screen.getByText('Configuration changes unavailable')).toBeInTheDocument();
    expect(screen.getByText('This Alertmanager does not support updating time intervals.')).toBeInTheDocument();
  });
});
