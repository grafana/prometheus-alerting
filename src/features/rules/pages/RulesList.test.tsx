import React from 'react';
import { render, screen } from '@testing-library/react';
import { setDataSourceSrv } from '@grafana/runtime';
import { beforeEach, describe, expect, it, rs } from '@rstest/core';

import RulesPage from './RulesList';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';
import * as grafanaRuntimeActual from '@grafana/runtime' with { rstest: 'importActual' };

rs.mock('@grafana/runtime', () => ({
  ...grafanaRuntimeActual,
  PluginPage: ({ children }: { children: React.ReactNode }) => <div data-testid="plugin-page">{children}</div>,
}));

// The list views issue real queries against the data sources, which is not what these tests are about.
rs.mock('../list/GroupedView', () => ({
  GroupedView: () => <div data-testid="grouped-view" />,
}));

rs.mock('../list/FilterView', () => ({
  FilterView: () => <div data-testid="filter-view" />,
}));

/** A data source service with no data sources at all, Prometheus-compatible or otherwise. */
function createEmptyDataSourceSrv() {
  const srv = createMockDataSourceSrv();
  return { ...srv, getList: () => [], getInstanceSettings: () => undefined };
}

function renderRulesPage(path = '/rules') {
  const Wrapper = createTestWrapper();
  return render(
    <Wrapper>
      <TestMemoryRouter initialEntries={[path]}>
        <RulesPage />
      </TestMemoryRouter>
    </Wrapper>
  );
}

describe('RulesPage', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('shows an empty state when no rules data sources are configured', () => {
    setDataSourceSrv(createEmptyDataSourceSrv() as never);

    renderRulesPage();

    expect(screen.getByText('No rules data sources configured')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add data source/i })).toBeInTheDocument();
    expect(screen.queryByTestId('grouped-view')).not.toBeInTheDocument();
  });

  it('shows the empty state instead of the filter view when filters are active', () => {
    setDataSourceSrv(createEmptyDataSourceSrv() as never);

    renderRulesPage('/rules?search=namespace:my-namespace');

    expect(screen.getByText('No rules data sources configured')).toBeInTheDocument();
    expect(screen.queryByTestId('filter-view')).not.toBeInTheDocument();
  });

  it('renders the grouped view when rules sources exist', () => {
    renderRulesPage();

    expect(screen.queryByText('No rules data sources configured')).not.toBeInTheDocument();
    expect(screen.getByTestId('grouped-view')).toBeInTheDocument();
  });
});
