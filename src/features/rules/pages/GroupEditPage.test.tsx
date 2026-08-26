import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import yaml from 'js-yaml';
import { Route, Routes } from 'react-router-dom';

import { setDataSourceSrv } from '@grafana/runtime';
import { reloadDataSourceInstanceSettings } from '@grafana/runtime/unstable';
import type { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { server } from '../../../test';
import { DataSourceInstanceSettingsFactory } from '../../../test/fixtures/datasources';
import { AlertingPermission } from '../../../access-control/abilities';
import { setMockNamespaces } from '../../../test/handlers/ruler';
import { createMockDataSourceSrv, setCurrentUserPermissions } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';

import GroupEditPage from './GroupEditPage';

const DATA_SOURCE_UID = 'test-mimir-uid';
const NAMESPACE = 'test-namespace';
const GROUP_NAME = 'test-group';

/** A federated Mimir group: most of these settings have no field in the edit form. */
const federatedGroup: RulerRuleGroupDTO = {
  name: GROUP_NAME,
  interval: '1m',
  limit: 10,
  query_offset: '2m',
  source_tenants: ['tenant-a', 'tenant-b'],
  align_evaluation_time_on_interval: true,
  rules: [{ alert: 'HighErrorRate', expr: 'up == 0', for: '5m' }],
};

const mimirDataSource = DataSourceInstanceSettingsFactory.build({
  uid: DATA_SOURCE_UID,
  name: 'Test Mimir',
  type: 'prometheus',
});

/**
 * Makes the data source resolvable and reports a Mimir with the Ruler API enabled, which is what
 * gates the edit form on.
 */
async function loadDataSource() {
  server.use(
    http.get('/api/frontend/settings', () =>
      HttpResponse.json({
        datasources: { [mimirDataSource.uid]: mimirDataSource },
        defaultDatasource: mimirDataSource.name,
      })
    ),
    http.get('/api/datasources/proxy/uid/:uid/api/v1/status/buildinfo', () =>
      HttpResponse.json({
        status: 'success',
        data: { version: '2.9.3', features: { ruler_config_api: 'true' } },
      })
    )
  );

  // Feature discovery reads the runtime's data source settings cache, which is otherwise empty in
  // tests. Fill it before setting the mock DataSourceSrv: with a srv in place, a reload delegates
  // to `srv.reload()` and the cache stays empty. The Ruler URL builder needs the srv as well.
  await reloadDataSourceInstanceSettings();
  setDataSourceSrv(createMockDataSourceSrv());
}

/** Records the group definitions written to the Ruler API while a test runs */
function captureRulerWrites() {
  const upserts: RulerRuleGroupDTO[] = [];

  server.use(
    http.post(`/api/datasources/proxy/uid/:dataSourceUid/config/v1/rules/:namespace`, async ({ request }) => {
      upserts.push(yaml.load(await request.text()) as RulerRuleGroupDTO);
      return HttpResponse.json({ status: 'success', data: null });
    })
  );

  return upserts;
}

function renderGroupEditPage() {
  const Wrapper = createTestWrapper(DATA_SOURCE_UID);

  render(
    <Wrapper>
      <TestMemoryRouter initialEntries={[`/groups/${DATA_SOURCE_UID}/${NAMESPACE}/${GROUP_NAME}/edit`]}>
        <Routes>
          <Route path="/groups/:dataSourceUid/:namespace/:groupName/edit" element={<GroupEditPage />} />
        </Routes>
      </TestMemoryRouter>
    </Wrapper>
  );
}

describe('GroupEditPage', () => {
  beforeEach(async () => {
    setMockNamespaces({ [NAMESPACE]: [federatedGroup] });
    setCurrentUserPermissions(AlertingPermission.RulesRead, AlertingPermission.RulesWrite);
    await loadDataSource();
  });

  it('keeps the group settings the form has no field for when saving', async () => {
    const upserts = captureRulerWrites();
    const user = userEvent.setup();

    renderGroupEditPage();

    const intervalInput = await screen.findByRole('textbox', { name: /Evaluation interval/i });
    await user.clear(intervalInput);
    await user.type(intervalInput, '5m');
    await user.click(screen.getByRole('button', { name: /Save/i }));

    // The payload used to be rebuilt from name, interval and rules alone, so a group edit
    // de-federated the group and dropped its limit and query offset
    await waitFor(() => expect(upserts).toHaveLength(1));
    expect(upserts[0]).toEqual({ ...federatedGroup, interval: '5m' });
  });
});
