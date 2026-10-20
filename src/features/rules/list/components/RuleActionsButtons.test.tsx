import React from 'react';

import { reloadDataSourceInstanceSettings } from '@grafana/runtime/unstable';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { AlertingPermission } from '../../../../access-control/abilities';
import { DataSourceInstanceSettingsFactory } from '../../../../test/fixtures/datasources';
import { setCurrentUserPermissions } from '../../../../test/mocks/grafana-runtime';
import { server } from '../../../../test/server';
import { createTestWrapper } from '../../../../test/utils/test-wrapper';

import { RuleActionsButtons } from './RuleActionsButtons';

const buildInfoUrl = '/api/datasources/proxy/uid/:uid/api/v1/status/buildinfo';
const mimirDataSource = DataSourceInstanceSettingsFactory.build({
  uid: 'test-mimir-uid',
  name: 'Test Mimir',
  type: 'prometheus',
});
const prometheusDataSource = DataSourceInstanceSettingsFactory.build({
  uid: 'prometheus-1',
  name: 'Prometheus',
  type: 'prometheus',
});

async function loadDataSourceSettings() {
  server.use(
    http.get('/api/frontend/settings', () =>
      HttpResponse.json({
        datasources: {
          [mimirDataSource.uid]: mimirDataSource,
          [prometheusDataSource.uid]: prometheusDataSource,
        },
        defaultDatasource: prometheusDataSource.name,
      })
    )
  );

  // discoverDataSourceFeatures calls getDataSourceInstanceSettings(), whose cache is otherwise empty in tests.
  await reloadDataSourceInstanceSettings();
}

function mockBuildInfo() {
  server.use(
    http.get(buildInfoUrl, ({ params }) => {
      if (params.uid === mimirDataSource.uid) {
        return HttpResponse.json({
          status: 'success',
          data: {
            application: 'mimir',
            version: '2.17.0',
            features: { ruler_config_api: 'true' },
          },
        });
      }

      return HttpResponse.json({
        status: 'success',
        data: { application: 'prometheus', version: '2.17.0' },
      });
    })
  );
}

function groupIdentifier(dataSourceUid: string) {
  return {
    rulesSource: { uid: dataSourceUid, name: 'Test data source' },
    namespace: { name: 'default' },
    groupName: 'alerts',
  };
}

const promRule = {
  name: 'HighErrorRate',
  query: 'rate(errors_total[5m]) > 0',
  health: 'ok',
  state: 'inactive' as const,
  type: 'alerting' as const,
};

const rulerRule = {
  alert: 'HighErrorRate',
  expr: 'rate(errors_total[5m]) > 0',
};

function renderActions(dataSourceUid: string) {
  return render(
    <RuleActionsButtons
      rule={rulerRule}
      promRule={promRule}
      groupIdentifier={groupIdentifier(dataSourceUid)}
      onDelete={vi.fn()}
      onDuplicate={vi.fn()}
    />,
    { wrapper: createTestWrapper(dataSourceUid) }
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'More' }));
}

describe('RuleActionsButtons', () => {
  beforeAll(loadDataSourceSettings);

  beforeEach(mockBuildInfo);

  it('hides rule mutations and renders no leading divider for a read-only user', async () => {
    const user = userEvent.setup();
    setCurrentUserPermissions(AlertingPermission.RulesRead);

    renderActions(mimirDataSource.uid);

    await waitFor(() => expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument());
    await openMenu(user);

    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Duplicate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('menu').children).toHaveLength(1);
  });

  it('hides Edit when the data source has no Ruler API', async () => {
    setCurrentUserPermissions(AlertingPermission.RulesRead, AlertingPermission.RulesWrite);

    renderActions(prometheusDataSource.uid);

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument());
  });

  it('shows Edit, Duplicate, and Delete for a writable Ruler data source', async () => {
    const user = userEvent.setup();
    setCurrentUserPermissions(AlertingPermission.RulesRead, AlertingPermission.RulesWrite);

    renderActions(mimirDataSource.uid);

    await waitFor(() => expect(screen.getByRole('link', { name: 'Edit' })).toBeInTheDocument());
    await openMenu(user);

    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Export' })).not.toBeInTheDocument();
    expect(screen.getByRole('menu').children).toHaveLength(5);
  });
});
