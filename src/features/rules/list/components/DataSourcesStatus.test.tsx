import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  DataSourceErrorsProvider,
  useReportDataSourceError,
  useReportDataSourceLoading,
  useReportEmptyDataSource,
} from '../hooks/useDataSourceErrors';

import {
  DataSourcesLoadingBar,
  DataSourcesStatusField,
  HiddenDataSourcesLink,
  LOADING_BAR_HIDE_DELAY_MS,
  LOADING_STATUS_SHOW_DELAY_MS,
  withoutProxyPrefix,
} from './DataSourcesStatus';

const fetchError = { status: 500, data: { message: 'connection refused' } };
const forbiddenError = { status: 403, data: {} };

function ErrorReporter({ uid, name, error }: { uid: string; name: string; error?: unknown }) {
  useReportDataSourceError(uid, name, error);
  return null;
}

function EmptyReporter({ uid, name }: { uid: string; name: string }) {
  useReportEmptyDataSource(uid, name, true);
  return null;
}

function LoadingReporter({ uid, isLoading = true }: { uid: string; isLoading?: boolean }) {
  useReportDataSourceLoading(uid, isLoading);
  return null;
}

function renderFooter(children: React.ReactNode) {
  return render(
    <DataSourceErrorsProvider>
      {children}
      <DataSourcesLoadingBar />
      <DataSourcesStatusField />
    </DataSourceErrorsProvider>
  );
}

describe('DataSourcesStatusField', () => {
  it('renders nothing when no data source reported an error', () => {
    renderFooter(<ErrorReporter uid="prom" name="Prometheus" />);

    expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
  });

  it('summarises the number of failing data sources', () => {
    renderFooter(
      <>
        <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
        <ErrorReporter uid="mimir" name="Mimir" error={forbiddenError} />
      </>
    );

    expect(screen.getByRole('button', { name: '2 hidden' })).toBeInTheDocument();
  });

  it('shows the error message of every failing data source in a drawer', async () => {
    renderFooter(
      <>
        <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
        <ErrorReporter uid="mimir" name="Mimir" error={forbiddenError} />
      </>
    );

    await userEvent.click(screen.getByRole('button', { name: /hidden$/ }));

    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveTextContent('Prometheus');
    expect(drawer).toHaveTextContent('connection refused');
    expect(drawer).toHaveTextContent('Mimir');
    expect(drawer).toHaveTextContent('You do not have permission to access rules from this data source.');
  });

  it('shows the message of a bodyless failure once, without a generic title', async () => {
    renderFooter(
      <ErrorReporter uid="prom" name="Prometheus" error={{ status: 502, statusText: 'Bad Gateway', data: {} }} />
    );

    await userEvent.click(screen.getByRole('button', { name: /hidden$/ }));

    expect(screen.queryByText('Cannot load rules for this data source')).not.toBeInTheDocument();
    expect(screen.getAllByText(/HTTP 502 Bad Gateway/)).toHaveLength(1);
  });

  it('stops reporting an error once it is resolved', () => {
    const { rerender } = renderFooter(<ErrorReporter uid="prom" name="Prometheus" error={fetchError} />);

    // Translations are not loaded in tests, so the plural form falls back to the default value
    expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();

    rerender(
      <DataSourceErrorsProvider>
        <ErrorReporter uid="prom" name="Prometheus" />
        <DataSourcesLoadingBar />
        <DataSourcesStatusField />
      </DataSourceErrorsProvider>
    );

    expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
  });

  it('reports data sources without rules next to the failing ones', async () => {
    renderFooter(
      <>
        <EmptyReporter uid="loki" name="Loki" />
        <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
      </>
    );

    const button = screen.getByRole('button', { name: '2 hidden' });
    await userEvent.hover(button);
    expect(
      await screen.findByText(/^1 data sources? reported errors · 1 data sources? ha(s|ve) no rules$/)
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /hidden$/ }));

    // Failures come first, they are the ones that need fixing
    const names = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(names).toEqual(expect.arrayContaining(['Prometheus', 'Loki']));
    expect(names.indexOf('Prometheus')).toBeLessThan(names.indexOf('Loki'));
    expect(screen.getByRole('dialog')).toHaveTextContent('This data source has no rules.');
  });

  describe('loading bar', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('stays up for a moment after the last data source finished, so it does not blink between them', () => {
      const { rerender } = renderFooter(<LoadingReporter uid="mimir" />);

      expect(screen.getByRole('status', { name: 'Loading rules' })).toBeInTheDocument();

      rerender(
        <DataSourceErrorsProvider>
          <LoadingReporter uid="mimir" isLoading={false} />
          <DataSourcesLoadingBar />
          <DataSourcesStatusField />
        </DataSourceErrorsProvider>
      );

      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS - 1));
      expect(screen.getByRole('status', { name: 'Loading rules' })).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1));
      expect(screen.queryByRole('status', { name: 'Loading rules' })).not.toBeInTheDocument();
    });

    it('keeps going when another data source starts loading before the delay is up', () => {
      const { rerender } = renderFooter(<LoadingReporter uid="mimir" />);

      rerender(
        <DataSourceErrorsProvider>
          <LoadingReporter uid="mimir" isLoading={false} />
          <DataSourcesLoadingBar />
          <DataSourcesStatusField />
        </DataSourceErrorsProvider>
      );
      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS / 2));

      rerender(
        <DataSourceErrorsProvider>
          <LoadingReporter uid="mimir" isLoading={false} />
          <LoadingReporter uid="loki" />
          <DataSourcesLoadingBar />
          <DataSourcesStatusField />
        </DataSourceErrorsProvider>
      );
      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS));

      expect(screen.getByRole('status', { name: 'Loading rules' })).toBeInTheDocument();
    });
  });

  describe('status field while loading', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    const loadingStatus = () => screen.queryByRole('button', { name: 'Loading rules' });

    it('only says it is loading when loading takes a while', () => {
      renderFooter(<LoadingReporter uid="mimir" />);

      act(() => vi.advanceTimersByTime(LOADING_STATUS_SHOW_DELAY_MS - 1));
      expect(loadingStatus()).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1));
      expect(loadingStatus()).toBeInTheDocument();
    });

    it('shows the hidden data sources once loading has settled', () => {
      const { rerender } = renderFooter(<LoadingReporter uid="mimir" />);
      act(() => vi.advanceTimersByTime(LOADING_STATUS_SHOW_DELAY_MS));

      rerender(
        <DataSourceErrorsProvider>
          <LoadingReporter uid="mimir" isLoading={false} />
          <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
          <DataSourcesStatusField />
        </DataSourceErrorsProvider>
      );
      expect(loadingStatus()).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS));
      expect(loadingStatus()).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();
    });

    it('does not show a hidden count while data sources are still coming in', () => {
      renderFooter(
        <>
          <LoadingReporter uid="mimir" />
          <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
        </>
      );

      expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
      expect(loadingStatus()).not.toBeInTheDocument();
    });
  });

  describe('link next to the data source filter', () => {
    function renderLink(children: React.ReactNode) {
      return render(
        <DataSourceErrorsProvider>
          {children}
          <HiddenDataSourcesLink />
        </DataSourceErrorsProvider>
      );
    }

    it('opens the list of hidden data sources', async () => {
      renderLink(<ErrorReporter uid="prom" name="Prometheus" error={fetchError} />);

      await userEvent.click(screen.getByRole('button', { name: '1 hidden' }));

      expect(screen.getByRole('dialog')).toHaveTextContent('connection refused');
    });

    it('waits for loading to settle before showing a count', () => {
      renderLink(
        <>
          <LoadingReporter uid="mimir" />
          <ErrorReporter uid="prom" name="Prometheus" error={fetchError} />
        </>
      );

      expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
    });
  });
});

describe('withoutProxyPrefix', () => {
  it('keeps only the endpoint the data source was asked for', () => {
    expect(withoutProxyPrefix('api/datasources/proxy/uid/abc/api/v1/rules', 'abc')).toBe('/api/v1/rules');
    expect(withoutProxyPrefix('/api/datasources/proxy/uid/abc', 'abc')).toBe('/');
  });

  it('leaves anything else alone', () => {
    expect(withoutProxyPrefix('HTTP 502 Bad Gateway', 'abc')).toBe('HTTP 502 Bad Gateway');
    expect(withoutProxyPrefix('api/datasources/proxy/uid/other/api/v1/rules', 'abc')).toBe(
      'api/datasources/proxy/uid/other/api/v1/rules'
    );
  });
});
