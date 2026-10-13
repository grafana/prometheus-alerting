import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';

import { createMockDataSourceSrv } from '../../../../test/mocks/grafana-runtime';

import { DataSourceErrorsProvider, useDataSourceErrors } from '../hooks/useDataSourceErrors';

import { DataSourceErrorBoundary } from './DataSourceErrorBoundary';

function ReportedDataSources() {
  const { errors } = useDataSourceErrors();

  return (
    <ul aria-label="Reported data sources">
      {errors.map((error) => (
        <li key={error.uid}>{`${error.uid}: ${error.kind}`}</li>
      ))}
    </ul>
  );
}

function CrashingRules(): React.ReactNode {
  throw new Error('bug in our own rendering');
}

describe('DataSourceErrorBoundary', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('shows a crash in the section without reporting the data source as failing', async () => {
    // React logs every caught render error, that's expected here
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <DataSourceErrorsProvider>
        <DataSourceErrorBoundary rulesSourceIdentifier={{ uid: 'test-mimir-uid', name: 'Mimir' }}>
          <CrashingRules />
        </DataSourceErrorBoundary>
        <ReportedDataSources />
      </DataSourceErrorsProvider>
    );

    expect(
      await screen.findByRole('alert', { name: 'Unable to load rules from this data source' })
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Reported data sources' })).queryByRole('listitem')
    ).not.toBeInTheDocument();
  });
});
