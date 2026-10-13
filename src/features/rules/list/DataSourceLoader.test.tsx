import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';

import { server } from '../../../test';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';

import { discoverDataSourceFeatures } from '../../../api/rules/featureDiscovery';

import { DataSourceLoader } from './DataSourceLoader';
import { DataSourceErrorsProvider, useDataSourceErrors } from './hooks/useDataSourceErrors';

// Calls the real discovery unless a test says otherwise
vi.mock('../../../api/rules/featureDiscovery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/rules/featureDiscovery')>();
  return { ...actual, discoverDataSourceFeatures: vi.fn(actual.discoverDataSourceFeatures) };
});

const LOKI_UID = 'test-loki-uid';
const MIMIR_UID = 'test-mimir-uid';

function renderLoader(uid: string, name: string) {
  return render(<DataSourceLoader rulesSourceIdentifier={{ uid, name }} />, {
    wrapper: createTestWrapper(uid),
  });
}

/** Makes every discovery probe for `uid` fail, e.g. as an unsigned or unauthorized request would. */
function failDiscoveryWith(uid: string, status: number, message: string) {
  server.use(
    http.get(`/api/datasources/proxy/uid/${uid}/*`, () => HttpResponse.json({ message }, { status })),
    http.get(`/api/datasources/uid/${uid}`, () => HttpResponse.json({ message }, { status }))
  );
}

/** Lists what the loader reported, so we can check it without the UI that shows it */
function ReportedDataSources() {
  const { errors } = useDataSourceErrors();

  return (
    <ul aria-label="Reported data sources">
      {errors.map((error) => (
        <li key={error.uid}>{`${error.uid}: ${error.kind}: ${error.description}`}</li>
      ))}
    </ul>
  );
}

/** Waits for what the loader reported, the data source section is a list item too */
async function findReported() {
  return within(screen.getByRole('list', { name: 'Reported data sources' })).findByRole('listitem');
}

describe('DataSourceLoader', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  // Regression: the icon used to come only from feature discovery, so a data source whose discovery
  // failed lost its icon and was hard to tell apart from its neighbours in the list.
  it('keeps the data source icon when feature discovery fails, for a flavor whose application is settled by its plugin type', async () => {
    failDiscoveryWith(LOKI_UID, 500, 'boom');

    renderLoader(LOKI_UID, 'Test Loki');

    expect(await screen.findByRole('button', { name: /error/i })).toBeInTheDocument();
    expect(screen.getByAltText('Loki')).toBeInTheDocument();
  });

  // A `prometheus`-type data source could be Prometheus, Mimir, or Cortex, and only discovery can
  // say which -- so there is no application to key an icon off. Fall back to the plugin's own logo
  // rather than showing nothing.
  it("falls back to the plugin logo for a prometheus-type data source, whose application can't be known", async () => {
    failDiscoveryWith(MIMIR_UID, 500, 'boom');

    renderLoader(MIMIR_UID, 'Test Mimir');

    expect(await screen.findByRole('button', { name: /error/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Prometheus' })).toHaveAttribute(
      'src',
      'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg'
    );
  });

  it('reports a data source whose feature discovery fails', async () => {
    failDiscoveryWith(LOKI_UID, 500, 'boom');

    render(
      <DataSourceErrorsProvider>
        <DataSourceLoader rulesSourceIdentifier={{ uid: LOKI_UID, name: 'Test Loki' }} />
        <ReportedDataSources />
      </DataSourceErrorsProvider>,
      { wrapper: createTestWrapper(LOKI_UID) }
    );

    const reported = await findReported();
    expect(reported).toHaveTextContent(/^test-loki-uid: error: /);
  });
});

describe('DataSourceLoader mounted again after feature discovery failed', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
    vi.mocked(discoverDataSourceFeatures).mockClear();
  });

  /** Clears the report, like the list view does when it loads the data source fine */
  function ClearReport() {
    const { clearError } = useDataSourceErrors();

    return <button onClick={() => clearError(LOKI_UID)}>Clear report</button>;
  }

  function Page({ showLoader }: { showLoader: boolean }) {
    return (
      <DataSourceErrorsProvider>
        {showLoader && <DataSourceLoader rulesSourceIdentifier={{ uid: LOKI_UID, name: 'Test Loki' }} />}
        <ClearReport />
        <ReportedDataSources />
      </DataSourceErrorsProvider>
    );
  }

  it('does not report or show the old failure again while the retry is still running', async () => {
    vi.mocked(discoverDataSourceFeatures).mockRejectedValueOnce(new Error('boom'));
    const { rerender } = render(<Page showLoader />, { wrapper: createTestWrapper(LOKI_UID) });
    expect(await findReported()).toHaveTextContent(/^test-loki-uid: error: /);

    rerender(<Page showLoader={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear report' }));

    // The retry never answers, so whatever we see below is what shows while it is running
    vi.mocked(discoverDataSourceFeatures).mockReturnValueOnce(new Promise(() => {}));
    rerender(<Page showLoader />);

    await waitFor(() => expect(discoverDataSourceFeatures).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('button', { name: /error/i })).not.toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Reported data sources' })).queryByRole('listitem')).toBeNull();
  });
});
