import React, { useEffect } from 'react';

import { setDataSourceSrv } from '@grafana/runtime';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, vi } from 'vitest';

import { server } from '../../../test';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';
import { FRONTED_GROUPED_PAGE_SIZE } from '../../../utils/paginationLimits';

import { PaginatedDataSourceLoader } from './PaginatedDataSourceLoader';
import { DataSourceErrorsProvider, useDataSourceErrors } from './hooks/useDataSourceErrors';

vi.mock('@grafana/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@grafana/ui')>();
  return { ...actual, CodeEditor: ({ value }: { value: string }) => <pre>{value}</pre> };
});

const dataSourceUid = 'test-mimir-uid';
const namespace = 'platform-alerts';
const namespaceYaml = ['platform-alerts:', '  - name: group-a', '    rules: []', ''].join('\n');
const rulesSourceIdentifier = {
  uid: dataSourceUid,
  name: 'Mimir',
};

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

function queryReported() {
  return within(screen.getByRole('list', { name: 'Reported data sources' })).queryByRole('listitem');
}

function useRulesResponse() {
  server.use(
    http.get(`/api/datasources/proxy/uid/${dataSourceUid}/api/v1/rules`, () =>
      HttpResponse.json({
        status: 'success',
        data: {
          groups: [
            {
              name: 'group-a',
              file: namespace,
              interval: 60,
              rules: [
                {
                  name: 'HighErrorRate',
                  query: 'rate(errors_total[5m]) > 0',
                  health: 'ok',
                  state: 'inactive',
                  type: 'alerting',
                },
              ],
            },
          ],
        },
      })
    )
  );
}

function renderLoader(rulerApiEnabled: boolean, application: 'mimir' | 'prometheus') {
  const StoreWrapper = createTestWrapper(dataSourceUid);

  return render(
    <StoreWrapper>
      <TestMemoryRouter>
        <PaginatedDataSourceLoader
          rulesSourceIdentifier={rulesSourceIdentifier}
          application={application}
          rulerApiEnabled={rulerApiEnabled}
        />
      </TestMemoryRouter>
    </StoreWrapper>
  );
}

describe('PaginatedDataSourceLoader namespace YAML action', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
    useRulesResponse();
  });

  it('loads the selected namespace from the Ruler endpoint', async () => {
    const user = userEvent.setup();
    const namespaceRequest = vi.fn();
    server.use(
      http.get(`/api/datasources/proxy/uid/${dataSourceUid}/config/v1/rules/${namespace}`, () => {
        namespaceRequest();
        return HttpResponse.text(namespaceYaml, { headers: { 'Content-Type': 'application/yaml' } });
      })
    );

    renderLoader(true, 'mimir');

    await user.click(await screen.findByRole('button', { name: `View YAML for namespace ${namespace}` }));

    expect(await screen.findByRole('heading', { name: 'View namespace YAML' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Copy to clipboard' })).toBeInTheDocument();
    expect(namespaceRequest).toHaveBeenCalledOnce();
  });

  it('does not show the action when Ruler is unavailable', async () => {
    renderLoader(false, 'prometheus');

    expect(await screen.findByRole('heading', { name: namespace })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View YAML for namespace/ })).not.toBeInTheDocument();
  });
});

function renderWithReport(filters: { groupFilter?: string } = {}) {
  const StoreWrapper = createTestWrapper(dataSourceUid);

  return render(
    <StoreWrapper>
      <TestMemoryRouter>
        <DataSourceErrorsProvider>
          <PaginatedDataSourceLoader
            rulesSourceIdentifier={rulesSourceIdentifier}
            application="mimir"
            rulerApiEnabled={false}
            hideOnEmpty={Boolean(filters.groupFilter)}
            {...filters}
          />
          <ReportedDataSources />
        </DataSourceErrorsProvider>
      </TestMemoryRouter>
    </StoreWrapper>
  );
}

describe('PaginatedDataSourceLoader with a data source that has no rules', () => {
  const rulesRequest = vi.fn();

  beforeEach(() => {
    rulesRequest.mockClear();
    setDataSourceSrv(createMockDataSourceSrv());
    server.use(
      http.get(`/api/datasources/proxy/uid/${dataSourceUid}/api/v1/rules`, () => {
        rulesRequest();
        return HttpResponse.json({ status: 'success', data: { groups: [] } });
      })
    );
  });

  it('reports the data source as having no rules', async () => {
    renderWithReport();

    expect(await findReported()).toHaveTextContent('test-mimir-uid: empty: This data source has no rules.');
  });

  it('also reports it with filters active, the data source sent no groups at all', async () => {
    renderWithReport({ groupFilter: 'does-not-exist' });

    expect(await findReported()).toHaveTextContent('test-mimir-uid: empty: This data source has no rules.');
  });
});

describe('PaginatedDataSourceLoader with filters that match none of the groups', () => {
  const rulesResponse = vi.fn();

  beforeEach(() => {
    rulesResponse.mockClear();
    setDataSourceSrv(createMockDataSourceSrv());
    useRulesResponse();
    server.events.on('response:mocked', rulesResponse);
  });

  afterEach(() => {
    server.events.removeAllListeners('response:mocked');
  });

  it('does not report the data source, nothing matching is not the same as having no rules', async () => {
    renderWithReport({ groupFilter: 'does-not-exist' });

    // Let the only page arrive and React handle it, a wrong "empty" report would be there by then
    await waitFor(() => expect(rulesResponse).toHaveBeenCalled());
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(queryReported()).not.toBeInTheDocument();
  });
});

describe('PaginatedDataSourceLoader with a later page that fails', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
    server.use(
      http.get(`/api/datasources/proxy/uid/${dataSourceUid}/api/v1/rules`, ({ request }) => {
        if (new URL(request.url).searchParams.has('group_next_token')) {
          return HttpResponse.json({ status: 'error', error: 'upstream timed out' }, { status: 502 });
        }

        return HttpResponse.json({
          status: 'success',
          data: {
            // A full page, so the next page is only asked for once the user clicks "Show more"
            groups: Array.from({ length: FRONTED_GROUPED_PAGE_SIZE }, (_, index) => ({
              name: `group-${index}`,
              file: namespace,
              interval: 60,
              rules: [],
            })),
            groupNextToken: 'page-2',
          },
        });
      })
    );
  });

  it('does not report the data source, the groups that did load show it works', async () => {
    renderWithReport();

    await userEvent.click(await screen.findByRole('button', { name: 'Show more…' }));

    expect(await screen.findByRole('button', { name: 'Error' })).toBeInTheDocument();
    expect(queryReported()).not.toBeInTheDocument();
  });
});

/** Reports an error for the data source up front, like an earlier view that saw it fail */
function EarlierReport() {
  const { reportError } = useDataSourceErrors();

  useEffect(() => {
    reportError({ uid: dataSourceUid, kind: 'error', description: 'failed in an earlier view' });
  }, [reportError]);

  return null;
}

describe('PaginatedDataSourceLoader with filters that match nothing on the pages that loaded', () => {
  const failedPageRequest = vi.fn();

  beforeEach(() => {
    failedPageRequest.mockClear();
    setDataSourceSrv(createMockDataSourceSrv());
    server.use(
      http.get(`/api/datasources/proxy/uid/${dataSourceUid}/api/v1/rules`, ({ request }) => {
        if (new URL(request.url).searchParams.has('group_next_token')) {
          failedPageRequest();
          return HttpResponse.json({ status: 'error', error: 'upstream timed out' }, { status: 502 });
        }

        return HttpResponse.json({
          status: 'success',
          data: {
            groups: [{ name: 'group-a', file: namespace, interval: 60, rules: [] }],
            groupNextToken: 'page-2',
          },
        });
      })
    );
  });

  it('clears the earlier report and does not report the failed page, the data source did send groups', async () => {
    const StoreWrapper = createTestWrapper(dataSourceUid);

    render(
      <StoreWrapper>
        <TestMemoryRouter>
          <DataSourceErrorsProvider>
            <EarlierReport />
            <PaginatedDataSourceLoader
              rulesSourceIdentifier={rulesSourceIdentifier}
              application="mimir"
              rulerApiEnabled={false}
              groupFilter="does-not-exist"
              hideOnEmpty
            />
            <ReportedDataSources />
          </DataSourceErrorsProvider>
        </TestMemoryRouter>
      </StoreWrapper>
    );

    await waitFor(() => expect(failedPageRequest).toHaveBeenCalled());
    await waitFor(() => expect(queryReported()).not.toBeInTheDocument());
  });
});
