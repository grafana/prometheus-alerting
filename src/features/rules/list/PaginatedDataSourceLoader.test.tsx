import React from 'react';

import { setDataSourceSrv } from '@grafana/runtime';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, vi } from 'vitest';

import { server } from '../../../test';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';

import { PaginatedDataSourceLoader } from './PaginatedDataSourceLoader';

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
  ruleSourceType: 'datasource' as const,
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
