import React from 'react';

import { reloadDataSourceInstanceSettings } from '@grafana/runtime/unstable';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

import { AlertingPermission } from '../../../access-control/abilities';
import { DataSourceInstanceSettingsFactory } from '../../../test/fixtures/datasources';
import { setCurrentUserPermissions } from '../../../test/mocks/grafana-runtime';
import { server } from '../../../test/server';
import { createTestWrapper } from '../../../test/utils/test-wrapper';

import { GroupDetailsActions } from './GroupDetailsActions';

const mimirDataSource = DataSourceInstanceSettingsFactory.build({
  uid: 'test-mimir-uid',
  name: 'Test Mimir',
  type: 'prometheus',
});

const group: RulerRuleGroupDTO = {
  name: 'alerts',
  interval: '1m',
  rules: [{ alert: 'HighErrorRate', expr: 'up == 0' }],
};

const federatedGroup: RulerRuleGroupDTO = { ...group, source_tenants: ['tenant-a', 'tenant-b'] };

/** Makes the data source resolvable and reports a Mimir with the Ruler API enabled. */
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
        data: { application: 'mimir', version: '2.17.0', features: { ruler_config_api: 'true' } },
      })
    )
  );

  // discoverDataSourceFeatures reads the runtime's data source settings cache, empty otherwise
  await reloadDataSourceInstanceSettings();
}

function renderActions(rulerGroup?: RulerRuleGroupDTO) {
  return render(<GroupDetailsActions editLink="/edit" dataSourceUid={mimirDataSource.uid} rulerGroup={rulerGroup} />, {
    wrapper: createTestWrapper(mimirDataSource.uid),
  });
}

describe('GroupDetailsActions', () => {
  beforeEach(async () => {
    setCurrentUserPermissions(AlertingPermission.RulesRead, AlertingPermission.RulesWrite);
    await loadDataSource();
  });

  it('offers Edit for an ordinary group', async () => {
    renderActions(group);

    await waitFor(() => expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument());
  });

  it('offers no Edit for a federated group', async () => {
    renderActions(federatedGroup);

    // Its source_tenants decide which tenants the rules read, and the edit form has no field for them
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument());
  });

  it('offers no Edit for a read-only user', async () => {
    setCurrentUserPermissions(AlertingPermission.RulesRead);

    renderActions(group);

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument());
  });
});
