import React from 'react';
import { render, screen } from '@testing-library/react';

import { ReceiversError } from './ReceiversError';

describe('ReceiversError', () => {
  it('renders permission feedback for forbidden reads', () => {
    render(<ReceiversError error={{ status: 403, data: { message: 'Forbidden' } }} />);

    expect(screen.getByText('Permission denied')).toBeInTheDocument();
    expect(screen.queryByText(/403/)).not.toBeInTheDocument();
  });
});
