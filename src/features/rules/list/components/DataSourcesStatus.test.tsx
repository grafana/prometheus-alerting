import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { setDataSourceSrv } from '@grafana/runtime';

import { createMockDataSourceSrv } from '../../../../test/mocks/grafana-runtime';

import {
  DataSourceErrorsProvider,
  useReportDataSourceError,
  useReportEmptyDataSource,
  useReportHealthyDataSource,
} from '../hooks/useDataSourceErrors';

import {
  DataSourcesLoadingBar,
  DataSourcesStatusField,
  HIDDEN_COUNT_MAX_WAIT_MS,
  HiddenDataSourcesLink,
  LOADING_BAR_HIDE_DELAY_MS,
  LOADING_STATUS_SHOW_DELAY_MS,
  withoutProxyPrefix,
} from './DataSourcesStatus';

// Data sources from the runtime mock, the status looks their names up by uid
const PROMETHEUS_UID = 'prometheus-1';
const MIMIR_UID = 'test-mimir-uid';
const LOKI_UID = 'test-loki-uid';

// Loading comes from RTK Query's request state, which is tested on its own – here we only switch it on and off
const isLoadingRules = vi.hoisted(() => vi.fn(() => false));
vi.mock('../hooks/useIsLoadingRules', () => ({ useIsLoadingRules: isLoadingRules }));

function setLoading(isLoading: boolean) {
  isLoadingRules.mockReturnValue(isLoading);
}

beforeEach(() => {
  setDataSourceSrv(createMockDataSourceSrv());
  setLoading(false);
});

const fetchError = { status: 500, data: { message: 'connection refused' } };
const forbiddenError = { status: 403, data: {} };

function ErrorReporter({ uid, error }: { uid: string; error?: unknown }) {
  useReportDataSourceError(uid, error);
  return null;
}

function EmptyReporter({ uid }: { uid: string }) {
  useReportEmptyDataSource(uid, true);
  return null;
}

function HealthyReporter({ uid }: { uid: string }) {
  useReportHealthyDataSource(uid, true);
  return null;
}

function footer(children?: React.ReactNode) {
  return (
    <DataSourceErrorsProvider>
      {children}
      <DataSourcesLoadingBar />
      <DataSourcesStatusField />
    </DataSourceErrorsProvider>
  );
}

function renderFooter(children?: React.ReactNode) {
  return render(footer(children));
}

describe('DataSourcesStatusField', () => {
  it('renders nothing when no data source reported an error', () => {
    renderFooter(<ErrorReporter uid={PROMETHEUS_UID} />);

    expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
  });

  it('summarises the number of failing data sources', () => {
    renderFooter(
      <>
        <ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />
        <ErrorReporter uid={MIMIR_UID} error={forbiddenError} />
      </>
    );

    expect(screen.getByRole('button', { name: '2 hidden' })).toBeInTheDocument();
  });

  it('shows the error message of every failing data source in a drawer', async () => {
    renderFooter(
      <>
        <ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />
        <ErrorReporter uid={MIMIR_UID} error={forbiddenError} />
      </>
    );

    await userEvent.click(screen.getByRole('button', { name: /hidden$/ }));

    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveTextContent('Prometheus');
    expect(drawer).toHaveTextContent('connection refused');
    expect(drawer).toHaveTextContent('Test Mimir');
    expect(drawer).toHaveTextContent('You do not have permission to access rules from this data source.');
  });

  it('shows the message of a bodyless failure once, without a generic title', async () => {
    renderFooter(<ErrorReporter uid={PROMETHEUS_UID} error={{ status: 502, statusText: 'Bad Gateway', data: {} }} />);

    await userEvent.click(screen.getByRole('button', { name: /hidden$/ }));

    expect(screen.queryByText('Cannot load rules for this data source')).not.toBeInTheDocument();
    expect(screen.getAllByText(/HTTP 502 Bad Gateway/)).toHaveLength(1);
  });

  it('keeps reporting an error after its component goes away, until the data source loads fine', () => {
    const { rerender } = renderFooter(<ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />);
    const renderWith = (children?: React.ReactNode) =>
      rerender(
        <DataSourceErrorsProvider>
          {children}
          <DataSourcesLoadingBar />
          <DataSourcesStatusField />
        </DataSourceErrorsProvider>
      );

    renderWith();
    expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();

    renderWith(<HealthyReporter uid={PROMETHEUS_UID} />);
    expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
  });

  it('stops reporting an error once it is resolved', () => {
    const { rerender } = renderFooter(<ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />);

    // Translations are not loaded in tests, so the plural form falls back to the default value
    expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();

    rerender(
      <DataSourceErrorsProvider>
        <ErrorReporter uid={PROMETHEUS_UID} />
        <DataSourcesLoadingBar />
        <DataSourcesStatusField />
      </DataSourceErrorsProvider>
    );

    expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
  });

  it('reports data sources without rules next to the failing ones', async () => {
    renderFooter(
      <>
        <EmptyReporter uid={LOKI_UID} />
        <ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />
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
    expect(names).toEqual(expect.arrayContaining(['Prometheus', 'Test Loki']));
    expect(names.indexOf('Prometheus')).toBeLessThan(names.indexOf('Test Loki'));
    expect(screen.getByRole('dialog')).toHaveTextContent('This data source has no rules.');
  });

  describe('loading bar', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('stays up for a moment after loading finished, so it does not blink when one request hands over to the next', () => {
      setLoading(true);
      const { rerender } = renderFooter();

      expect(screen.getByRole('status', { name: 'Loading rules' })).toBeInTheDocument();

      setLoading(false);
      rerender(footer());

      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS - 1));
      expect(screen.getByRole('status', { name: 'Loading rules' })).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1));
      expect(screen.queryByRole('status', { name: 'Loading rules' })).not.toBeInTheDocument();
    });

    it('keeps going when loading starts again before the delay is up', () => {
      setLoading(true);
      const { rerender } = renderFooter();

      setLoading(false);
      rerender(footer());
      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS / 2));

      setLoading(true);
      rerender(footer());
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
      setLoading(true);
      renderFooter();

      act(() => vi.advanceTimersByTime(LOADING_STATUS_SHOW_DELAY_MS - 1));
      expect(loadingStatus()).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(1));
      expect(loadingStatus()).toBeInTheDocument();
    });

    it('shows the hidden data sources once loading has settled', () => {
      setLoading(true);
      const { rerender } = renderFooter();
      act(() => vi.advanceTimersByTime(LOADING_STATUS_SHOW_DELAY_MS));

      setLoading(false);
      rerender(footer(<ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />));
      expect(loadingStatus()).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS));
      expect(loadingStatus()).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();
    });

    it('does not show a hidden count while data sources are still coming in', () => {
      setLoading(true);
      renderFooter(<ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />);

      expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
      expect(loadingStatus()).not.toBeInTheDocument();
    });
  });

  describe('link next to the data source filter', () => {
    function link(children?: React.ReactNode) {
      return (
        <DataSourceErrorsProvider>
          {children}
          <HiddenDataSourcesLink />
        </DataSourceErrorsProvider>
      );
    }

    it('opens the list of hidden data sources', async () => {
      render(link(<ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />));

      await userEvent.click(screen.getByRole('button', { name: '1 hidden' }));

      expect(screen.getByRole('dialog')).toHaveTextContent('connection refused');
    });

    it('keeps the count up while loading again, e.g. after switching views', () => {
      vi.useFakeTimers();
      const { rerender } = render(link(<ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />));

      // First load: the count waits until nothing is loading any more
      setLoading(true);
      rerender(link());
      expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();

      setLoading(false);
      rerender(link());
      act(() => vi.advanceTimersByTime(LOADING_BAR_HIDE_DELAY_MS));
      expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();

      // Loading again keeps the count that is already known
      setLoading(true);
      rerender(link());
      expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();
      vi.useRealTimers();
    });

    it('does not let a slow data source hold back the count for the others', () => {
      vi.useFakeTimers();
      setLoading(true);
      render(link(<ErrorReporter uid={PROMETHEUS_UID} error={fetchError} />));
      expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();

      act(() => vi.advanceTimersByTime(HIDDEN_COUNT_MAX_WAIT_MS));
      expect(screen.getByRole('button', { name: '1 hidden' })).toBeInTheDocument();
      vi.useRealTimers();
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
