import React from 'react';
import { render, screen } from '@testing-library/react';

import { RulesErrorAlert } from './RulesErrorAlert';

describe('RulesErrorAlert', () => {
  it('shows permission feedback for a forbidden datasource request', () => {
    render(<RulesErrorAlert error={{ status: 403 }} title="Failed to load rules" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You do not have permission to access rules from this data source.'
    );
  });

  it('shows the provided title and extracted message for other errors', () => {
    render(
      <RulesErrorAlert error={{ status: 500, data: { message: 'Request failed' } }} title="Failed to load rules" />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load rules');
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
  });
});
