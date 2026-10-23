import React from 'react';

import { setDataSourceSrv } from '@grafana/runtime';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, vi } from 'vitest';

import { server } from '../../../test';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';
import { FRONTED_GROUPED_PAGE_SIZE } from '../../../utils/paginationLimits';

import { PaginatedDataSourceLoader } from './PaginatedDataSourceLoader';
import { DataSourcesLoadingBar, DataSourcesStatusField } from './components/DataSourcesStatus';
import { DataSourceErrorsProvider } from './hooks/useDataSourceErrors';

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

describe('PaginatedDataSourceLoader with a data source that has no rules', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
    server.use(
      http.get(`/api/datasources/proxy/uid/${dataSourceUid}/api/v1/rules`, () =>
        HttpResponse.json({ status: 'success', data: { groups: [] } })
      )
    );
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
            <DataSourcesLoadingBar />
            <DataSourcesStatusField />
          </DataSourceErrorsProvider>
        </TestMemoryRouter>
      </StoreWrapper>
    );
  }

  it('hides the data source and reports it as having no rules', async () => {
    renderWithReport();

    // Translations are not loaded in tests, so the plural form falls back to the default value
    const button = await screen.findByRole('button', { name: '1 hidden' });
    expect(screen.queryByRole('heading', { name: 'Mimir' })).not.toBeInTheDocument();

    await userEvent.click(button);
    expect(screen.getByRole('dialog')).toHaveTextContent('This data source has no rules.');
  });

  it('hides and reports the data source when filters are active too, it sent no groups at all', async () => {
    renderWithReport({ groupFilter: 'does-not-exist' });

    await userEvent.click(await screen.findByRole('button', { name: '1 hidden' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('This data source has no rules.');
  });
});

describe('PaginatedDataSourceLoader with groups that do not match the filter', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
    server.use(
      http.get(`/api/datasources/proxy/uid/${dataSourceUid}/api/v1/rules`, () =>
        HttpResponse.json({
          status: 'success',
          data: { groups: [{ name: 'some-group', file: namespace, interval: 60, rules: [] }] },
        })
      )
    );
  });

  it('does not report the data source, nothing matching the filter does not make it empty', async () => {
    const StoreWrapper = createTestWrapper(dataSourceUid);

    render(
      <StoreWrapper>
        <TestMemoryRouter>
          <DataSourceErrorsProvider>
            <PaginatedDataSourceLoader
              rulesSourceIdentifier={rulesSourceIdentifier}
              application="mimir"
              rulerApiEnabled={false}
              groupFilter="does-not-exist"
              hideOnEmpty
            />
            <DataSourcesLoadingBar />
            <DataSourcesStatusField />
          </DataSourceErrorsProvider>
        </TestMemoryRouter>
      </StoreWrapper>
    );

    // The loading bar goes away once the response has come back and been handled
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Loading rules' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
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

  it('keeps the data source in the list with its error, and does not count it as hidden', async () => {
    const StoreWrapper = createTestWrapper(dataSourceUid);

    render(
      <StoreWrapper>
        <TestMemoryRouter>
          <DataSourceErrorsProvider>
            <PaginatedDataSourceLoader
              rulesSourceIdentifier={rulesSourceIdentifier}
              application="mimir"
              rulerApiEnabled={false}
            />
            <DataSourcesLoadingBar />
            <DataSourcesStatusField />
          </DataSourceErrorsProvider>
        </TestMemoryRouter>
      </StoreWrapper>
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Show more…' }));

    expect(await screen.findByRole('button', { name: 'Error' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: namespace })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('status', { name: 'Loading rules' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /hidden$/ })).not.toBeInTheDocument();
  });
});
