import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertGroupFactory } from '../mocks/alerts.fakes';
import { useAlertsFilters } from '../hooks/useAlertsFilters';
import { AlertsFilters } from './AlertsFilters';

function TestHarness() {
  const { filters, actions } = useAlertsFilters();
  return <AlertsFilters filters={filters} actions={actions} alertGroups={[AlertGroupFactory.build()]} />;
}

describe('AlertsFilters', () => {
  it('shows no error for well-formed label input', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.type(screen.getByPlaceholderText(/filter by labels/i), 'team=frontend');

    expect(screen.queryByText(/invalid label matcher syntax/i)).not.toBeInTheDocument();
  });

  it('shows an inline error for an unparseable label matcher instead of failing silently', async () => {
    const user = userEvent.setup();
    render(<TestHarness />);

    await user.type(screen.getByPlaceholderText(/filter by labels/i), '=====!!!bogus');

    expect(screen.getByText(/invalid label matcher syntax/i)).toBeInTheDocument();
  });
});
