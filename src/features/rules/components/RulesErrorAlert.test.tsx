import React from 'react';
import { render, screen } from '@testing-library/react';

import { RulesErrorAlert } from './RulesErrorAlert';

describe('RulesErrorAlert', () => {
  it('shows permission feedback for a forbidden datasource request', () => {
    render(<RulesErrorAlert error={{ status: 403, data: {} }} title="Failed to load rules" />);

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load rules');
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

  it('shows the ruler response verbatim, YAML position prefix and all', () => {
    render(
      <RulesErrorAlert
        error={{
          status: 400,
          data: '10:13: group "group-3", rule 1, "sdsdsds-1": invalid recording rule name: sdsdsds-1',
        }}
        title="Failed to save rule"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save rule');
    expect(screen.getByRole('alert')).toHaveTextContent(
      '10:13: group "group-3", rule 1, "sdsdsds-1": invalid recording rule name: sdsdsds-1'
    );
  });

  it('shows a multi-problem ruler response as one block of text, not a list', () => {
    render(
      <RulesErrorAlert
        error={{
          status: 400,
          data: '10:13: group "g", rule 1, "a": invalid recording rule name: a, 14:9: group "g", rule 2, "b": invalid label name: b',
        }}
        title="Failed to save rule"
      />
    );

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '10:13: group "g", rule 1, "a": invalid recording rule name: a, 14:9: group "g", rule 2, "b": invalid label name: b'
    );
  });
});
