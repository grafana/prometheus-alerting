import React from 'react';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import yaml from 'js-yaml';

import { setDataSourceSrv } from '@grafana/runtime';
import { createRulePositionHash } from '@grafana/external-rules/matching';
import type { PromAlertingRuleDTO } from '@grafana/external-rules/vanilla';

import { server } from '../../../test';
import { mockNamespaces } from '../../../test/fixtures/rule-groups';
import { createMockDataSourceSrv } from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';
import type { DataSourceRuleGroupIdentifier, DataSourceRulesSourceIdentifier } from '../../../types/rules';

import { DataSourceRuleLoader } from './DataSourceRuleLoader';

vi.mock('../../../api/rules/featureDiscovery.endpoints', async (importActual) => {
  const actual = await importActual<typeof import('../../../api/rules/featureDiscovery.endpoints')>();
  return {
    ...actual,
    useDiscoverFeaturesQuery: () => ({
      data: { application: 'mimir', rulerApiEnabled: true },
      isLoading: false,
    }),
  };
});

const DATA_SOURCE_UID = 'test-mimir-uid';
const RULES_SOURCE: DataSourceRulesSourceIdentifier = {
  uid: DATA_SOURCE_UID,
  name: 'Test Mimir',
  ruleSourceType: 'datasource',
};

function createGroupIdentifier(groupName: string): DataSourceRuleGroupIdentifier {
  return {
    rulesSource: RULES_SOURCE,
    namespace: { name: 'test-namespace' },
    groupName,
    groupOrigin: 'datasource',
  };
}

function renderLoaders() {
  const StoreWrapper = createTestWrapper(DATA_SOURCE_UID);
  const highErrorRate: PromAlertingRuleDTO = {
    name: 'HighErrorRate',
    query: 'rate(http_requests_total{status="500"}[5m]) > 0.1',
    health: 'ok',
    state: 'inactive',
    type: 'alerting',
    labels: { severity: 'critical' },
  };
  const lowDiskSpace: PromAlertingRuleDTO = {
    name: 'LowDiskSpace',
    query: 'node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1',
    health: 'ok',
    state: 'inactive',
    type: 'alerting',
    labels: { severity: 'warning' },
  };

  return render(
    <>
      <DataSourceRuleLoader
        rule={highErrorRate}
        groupIdentifier={createGroupIdentifier('test-group')}
        rulePositionHash={createRulePositionHash(0, 2)}
      />
      <DataSourceRuleLoader
        rule={lowDiskSpace}
        groupIdentifier={createGroupIdentifier('another-group')}
        rulePositionHash={createRulePositionHash(0, 1)}
      />
    </>,
    {
      wrapper: ({ children }) => (
        <StoreWrapper>
          <TestMemoryRouter>{children}</TestMemoryRouter>
        </StoreWrapper>
      ),
    }
  );
}

describe('DataSourceRuleLoader', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('loads one cached Ruler configuration instead of one request per matching group', async () => {
    let allRulesRequests = 0;
    let groupRequests = 0;

    server.use(
      http.get(`/api/datasources/proxy/uid/${DATA_SOURCE_UID}/config/v1/rules`, () => {
        allRulesRequests += 1;
        return HttpResponse.text(yaml.dump(mockNamespaces));
      }),
      http.get(`/api/datasources/proxy/uid/${DATA_SOURCE_UID}/config/v1/rules/:namespace/:group`, () => {
        groupRequests += 1;
        return HttpResponse.json({});
      })
    );

    renderLoaders();

    expect(await screen.findByText('HighErrorRate')).toBeInTheDocument();
    expect(await screen.findByText('LowDiskSpace')).toBeInTheDocument();
    expect(allRulesRequests).toBe(1);
    expect(groupRequests).toBe(0);
  });
});
