import React from 'react';
import { render, screen } from '@testing-library/react';

import { TimeIntervalMutationUnavailable, TimeIntervalsError } from './TimeIntervalsError';

describe('TimeIntervalsError', () => {
  it('renders permission feedback for forbidden reads', () => {
    render(<TimeIntervalsError error={{ status: 403, data: { message: 'Forbidden' } }} />);

    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(screen.queryByText(/403/)).not.toBeInTheDocument();
  });

  it('renders unsupported feedback for a missing configuration API', () => {
    render(<TimeIntervalMutationUnavailable ability={{ granted: false, cause: 'NOT_SUPPORTED' }} />);

    expect(screen.getByText('Time interval changes unavailable')).toBeInTheDocument();
    expect(screen.getByText('This Alertmanager does not support updating time intervals.')).toBeInTheDocument();
  });
});
