import React from 'react';
import { render, screen } from '@testing-library/react';

import { RuleDetailsTitle } from './RuleDetailsTitle';

describe('RuleDetailsTitle', () => {
  it('renders the rule name', () => {
    render(<RuleDetailsTitle name="HighErrorRate" type="alerting" state="inactive" health="ok" />);

    expect(screen.getByRole('heading', { name: 'HighErrorRate' })).toBeInTheDocument();
  });

  it('marks a rule whose group reads other tenants as federated', () => {
    render(
      <RuleDetailsTitle
        name="HighErrorRate"
        type="alerting"
        state="inactive"
        health="ok"
        sourceTenants={['tenant-a', 'tenant-b']}
      />
    );

    expect(screen.getByText('Federated')).toBeInTheDocument();
  });

  it('leaves a rule in an ordinary group unmarked', () => {
    render(<RuleDetailsTitle name="HighErrorRate" type="alerting" state="inactive" health="ok" />);

    expect(screen.queryByText('Federated')).not.toBeInTheDocument();
  });
});
