import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';

import { featureDiscoveryApi } from '../../../../api/rules/featureDiscovery.endpoints';
import { prometheusApi } from '../../../../api/rules/prometheus.endpoints';
import { createStore } from '../../../../store/store';
import { server } from '../../../../test';
import { createMockDataSourceSrv } from '../../../../test/mocks/grafana-runtime';

import { selectIsLoadingRules } from './useIsLoadingRules';

// Loki, because its plugin type alone tells us which flavor it is – the groups request needs that
const LOKI_UID = 'test-loki-uid';

/** Holds every request to the data source until `release` is called */
function holdRequests() {
  let release = () => {};
  const released = new Promise<void>((resolve) => (release = resolve));

  server.use(
    http.get(`/api/datasources/proxy/uid/${LOKI_UID}/*`, async () => {
      await released;
      return HttpResponse.json({ status: 'success', data: { groups: [] } });
    })
  );

  return release;
}

describe('selectIsLoadingRules', () => {
  beforeEach(() => {
    setDataSourceSrv(createMockDataSourceSrv());
  });

  it('is loading while feature discovery runs', async () => {
    const release = holdRequests();
    const store = createStore();

    const discovery = store.dispatch(featureDiscoveryApi.endpoints.discoverFeatures.initiate({ uid: LOKI_UID }));
    expect(selectIsLoadingRules(store.getState())).toBe(true);

    release();
    await discovery;
    expect(selectIsLoadingRules(store.getState())).toBe(false);
  });

  it('is loading while a page of rule groups loads', async () => {
    const release = holdRequests();
    const store = createStore();
    expect(selectIsLoadingRules(store.getState())).toBe(false);

    const groups = store.dispatch(prometheusApi.endpoints.getGroups.initiate({ ruleSource: { uid: LOKI_UID } }));
    expect(selectIsLoadingRules(store.getState())).toBe(true);

    release();
    await groups;
    expect(selectIsLoadingRules(store.getState())).toBe(false);
  });
});
