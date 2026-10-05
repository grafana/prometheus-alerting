import React from 'react';
import { render, screen } from '@testing-library/react';
import { rs } from '@rstest/core';

import { RouteWithID } from '@grafana/external-alertmanager/vanilla';

// @grafana/ui/unstable's barrel also pulls in the Table/TableNG module tree (an unrelated
// "unstable" export from the same file), which needs the `uwrap` package. Skip that whole
// chain in tests by mocking attachSkeleton as a pass-through - we're not testing the
// loading skeleton here, just RouteCard itself.
rs.mock('@grafana/ui/unstable', () => ({
  attachSkeleton: (Component: React.ComponentType<unknown>) => Component,
}));

import { RouteCard } from './RouteCard';

function buildRoute(overrides: Partial<RouteWithID> = {}): RouteWithID {
  return {
    id: 'route-1',
    receiver: 'default-receiver',
    ...overrides,
  };
}

describe('RouteCard', () => {
  it('renders the default route with its receiver', () => {
    render(<RouteCard currentRoute={buildRoute()} isDefault readOnly />);

    expect(screen.getByTestId('am-root-route-container')).toBeInTheDocument();
    expect(screen.getByTestId('receiver')).toHaveTextContent('default-receiver');
  });

  it('renders a non-default route with its matchers', () => {
    const route = buildRoute({ matchers: ['severity="critical"'] });

    render(<RouteCard currentRoute={route} readOnly />);

    expect(screen.getByTestId('am-route-container')).toBeInTheDocument();
    expect(screen.getByText('severity = critical')).toBeInTheDocument();
  });

  it('renders child routes', () => {
    const route = buildRoute({
      routes: [buildRoute({ id: 'child-1', receiver: 'child-receiver' })],
    });

    render(<RouteCard currentRoute={route} readOnly />);

    expect(screen.getByText('child-receiver')).toBeInTheDocument();
  });

  it('exposes add/edit/delete actions when not read-only', async () => {
    const onAddRoute = rs.fn();
    const onEditRoute = rs.fn();
    const onDeleteRoute = rs.fn();

    render(
      <RouteCard
        currentRoute={buildRoute()}
        readOnly={false}
        onAddRoute={onAddRoute}
        onEditRoute={onEditRoute}
        onDeleteRoute={onDeleteRoute}
      />
    );

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });
});
