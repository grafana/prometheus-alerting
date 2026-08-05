import React from 'react';
import { render, screen } from '@testing-library/react';
import { setDataSourceSrv } from '@grafana/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GroupedView } from './GroupedView';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';

vi.mock('@grafana/runtime');

/** A data source service with no data sources at all, Prometheus-compatible or otherwise. */
function createEmptyDataSourceSrv() {
  const srv = createMockDataSourceSrv();
  return { ...srv, getList: () => [], getInstanceSettings: () => undefined };
}

function renderGroupedView() {
  const Wrapper = createTestWrapper();
  return render(
    <Wrapper>
      <GroupedView />
    </Wrapper>
  );
}

describe('GroupedView', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('shows an empty state when no rules data sources are configured', () => {
    setDataSourceSrv(createEmptyDataSourceSrv() as never);

    renderGroupedView();

    expect(screen.getByText('No rules data sources configured')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add data source/i })).toBeInTheDocument();
  });

  it('lists the data sources instead of the empty state when rules sources exist', () => {
    renderGroupedView();

    expect(screen.queryByText('No rules data sources configured')).not.toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });
});
