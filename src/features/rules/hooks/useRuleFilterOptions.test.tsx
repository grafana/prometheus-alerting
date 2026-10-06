import React, { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';

import { setDataSourceSrv } from '@grafana/runtime';

import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import {
  DataSourceErrorsProvider,
  useReportDataSourceError,
  useReportEmptyDataSource,
} from '../list/hooks/useDataSourceErrors';

import { useDataSourceOptions } from './useRuleFilterOptions';

/** 'Test Mimir' is one of the mocked Prometheus-compatible data sources */
const FAILING_UID = 'test-mimir-uid';
const FAILING_NAME = 'Test Mimir';

function withFailingDataSource({ children }: PropsWithChildren) {
  return (
    <DataSourceErrorsProvider>
      <ErrorReporter />
      {children}
    </DataSourceErrorsProvider>
  );
}

function ErrorReporter() {
  // The inline error object is deliberate – reporting an error that is recreated on every render
  // must not re-trigger itself
  useReportDataSourceError(FAILING_UID, FAILING_NAME, { status: 500, data: {} });
  return null;
}

function withEmptyDataSource({ children }: PropsWithChildren) {
  return (
    <DataSourceErrorsProvider>
      <EmptyReporter />
      {children}
    </DataSourceErrorsProvider>
  );
}

function EmptyReporter() {
  useReportEmptyDataSource(FAILING_UID, FAILING_NAME, true);
  return null;
}

describe('useDataSourceOptions', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('lists all external rules sources when they are healthy', () => {
    const { result } = renderHook(() => useDataSourceOptions(), {
      wrapper: DataSourceErrorsProvider,
    });

    expect(result.current.map((option) => option.value)).toContain(FAILING_NAME);
  });

  it('drops data sources that reported an error', () => {
    const { result } = renderHook(() => useDataSourceOptions(), { wrapper: withFailingDataSource });

    expect(result.current.map((option) => option.value)).not.toContain(FAILING_NAME);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('drops data sources that have no rules', () => {
    const { result } = renderHook(() => useDataSourceOptions(), { wrapper: withEmptyDataSource });

    expect(result.current.map((option) => option.value)).not.toContain(FAILING_NAME);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('keeps a failing data source that is already selected, so it can be deselected', () => {
    const { result } = renderHook(() => useDataSourceOptions([FAILING_NAME]), { wrapper: withFailingDataSource });

    expect(result.current.map((option) => option.value)).toContain(FAILING_NAME);
  });
});
