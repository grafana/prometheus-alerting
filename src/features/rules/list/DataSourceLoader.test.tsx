import React from 'react';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';

import { server } from '../../../test';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';

import { DataSourcesLoadingBar, DataSourcesStatusField } from './components/DataSourcesStatus';
import { DataSourceLoader } from './DataSourceLoader';
import { DataSourceErrorsProvider } from './hooks/useDataSourceErrors';

const LOKI_UID = 'test-loki-uid';

/** Makes every discovery probe for `uid` fail, e.g. as an unsigned or unauthorized request would. */
function failDiscoveryWith(uid: string, status: number, message: string) {
  server.use(
    http.get(`/api/datasources/proxy/uid/${uid}/*`, () => HttpResponse.json({ message }, { status })),
    http.get(`/api/datasources/uid/${uid}`, () => HttpResponse.json({ message }, { status }))
  );
}

describe('DataSourceLoader', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  // Data sources we cannot talk to are hidden from the list and reported in one place instead
  it('hides a data source whose feature discovery fails and reports it in the error summary', async () => {
    failDiscoveryWith(LOKI_UID, 500, 'boom');

    render(
      <DataSourceErrorsProvider>
        <DataSourceLoader rulesSourceIdentifier={{ uid: LOKI_UID, name: 'Test Loki' }} />
        <DataSourcesLoadingBar />
        <DataSourcesStatusField />
      </DataSourceErrorsProvider>,
      { wrapper: createTestWrapper(LOKI_UID) }
    );

    expect(await screen.findByRole('button', { name: '1 hidden' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Test Loki' })).not.toBeInTheDocument();
  });
});
