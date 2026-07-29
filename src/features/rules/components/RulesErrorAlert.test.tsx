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

  it('keeps the server error detail for a forbidden datasource request', () => {
    render(
      <RulesErrorAlert
        error={{ status: 403, data: { message: 'Mimir tenant access denied' } }}
        title="Failed to load rules"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You do not have permission to access rules from this data source.'
    );
    expect(screen.getByText('Mimir tenant access denied')).toBeInTheDocument();
  });

  it('does not show a fallback detail for a forbidden request without a server message', () => {
    render(<RulesErrorAlert error={{ status: 403, data: {} }} title="Failed to load rules" />);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'You do not have permission to access rules from this data source.'
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('Unknown error occurred');
  });

  it('shows the provided title and extracted message for other errors', () => {
    render(
      <RulesErrorAlert error={{ status: 500, data: { message: 'Request failed' } }} title="Failed to load rules" />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load rules');
    expect(screen.getByRole('alert')).toHaveTextContent('Request failed');
  });
});
