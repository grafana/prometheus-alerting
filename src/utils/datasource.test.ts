import { setDataSourceSrv } from '@grafana/runtime';

import {
  BuiltInDataSourceInstanceSettingsFactory,
  DataSourceInstanceSettingsFactory,
} from '../test/fixtures/datasources';

import { getExternalRulesSources } from './datasource';

function setupSrv(list: ReturnType<typeof DataSourceInstanceSettingsFactory.buildList>) {
  setDataSourceSrv({
    getList: () => list,
    getInstanceSettings: (uid: string) => list.find((dataSource) => dataSource.uid === uid) ?? null,
    get: () => Promise.resolve({} as any),
    reload: () => Promise.resolve(),
  } as any);
}

describe('getExternalRulesSources', () => {
  it('returns prometheus and loki data sources', () => {
    const prometheus = DataSourceInstanceSettingsFactory.build({
      uid: 'prom-1',
      name: 'My Prometheus',
      type: 'prometheus',
    });
    const loki = DataSourceInstanceSettingsFactory.build({ uid: 'loki-1', name: 'My Loki', type: 'loki' });
    setupSrv([prometheus, loki]);

    const result = getExternalRulesSources();

    expect(result).toEqual([
      { uid: 'prom-1', name: 'My Prometheus', ruleSourceType: 'datasource' },
      { uid: 'loki-1', name: 'My Loki', ruleSourceType: 'datasource' },
    ]);
  });

  it('excludes built-in data sources such as "-- Grafana --"', () => {
    const grafanaBuiltIn = BuiltInDataSourceInstanceSettingsFactory.build({
      uid: 'grafana',
      name: '-- Grafana --',
      type: 'grafana',
    });
    const prometheus = DataSourceInstanceSettingsFactory.build({
      uid: 'prom-1',
      name: 'My Prometheus',
      type: 'prometheus',
    });
    setupSrv([grafanaBuiltIn, prometheus]);

    const result = getExternalRulesSources();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('My Prometheus');
  });

  it('excludes built-in "-- Mixed --" data source', () => {
    const mixed = BuiltInDataSourceInstanceSettingsFactory.build({ uid: 'mixed', name: '-- Mixed --', type: 'mixed' });
    setupSrv([mixed]);

    const result = getExternalRulesSources();

    expect(result).toHaveLength(0);
  });

  it('returns an empty array when no matching data sources exist', () => {
    setupSrv([]);

    const result = getExternalRulesSources();

    expect(result).toEqual([]);
  });
});
