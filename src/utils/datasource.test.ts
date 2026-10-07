import { config, setDataSourceSrv } from '@grafana/runtime';

import {
  BuiltInDataSourceInstanceSettingsFactory,
  DataSourceInstanceSettingsFactory,
} from '../test/fixtures/datasources';

import { getExternalRulesSources, isDataSourceManagingAlerts } from './datasource';

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
      { uid: 'prom-1', name: 'My Prometheus' },
      { uid: 'loki-1', name: 'My Loki' },
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
  it('excludes data sources an admin has taken out of the alerting UI', () => {
    const managed = DataSourceInstanceSettingsFactory.build({
      uid: 'prom-1',
      name: 'Managed',
      type: 'prometheus',
      jsonData: { manageAlerts: true },
    });
    const notManaged = DataSourceInstanceSettingsFactory.build({
      uid: 'prom-2',
      name: 'Not managed',
      type: 'prometheus',
      jsonData: { manageAlerts: false },
    });
    setupSrv([managed, notManaged]);

    expect(getExternalRulesSources().map((source) => source.name)).toEqual(['Managed']);
  });
});

describe('isDataSourceManagingAlerts', () => {
  const originalDefault = config.defaultDatasourceManageAlertsUiToggle;

  afterEach(() => {
    setDefaultToggle(originalDefault);
  });

  function setDefaultToggle(value: boolean) {
    // The runtime config is a plain object at runtime; there is no setter for a single field
    Object.assign(config, { defaultDatasourceManageAlertsUiToggle: value });
  }

  it.each([true, false])('uses the data source setting when it is set to %s', (manageAlerts) => {
    setDefaultToggle(!manageAlerts);
    const dataSource = DataSourceInstanceSettingsFactory.build({ jsonData: { manageAlerts } });

    expect(isDataSourceManagingAlerts(dataSource)).toBe(manageAlerts);
  });

  it.each([true, false])('falls back to the Grafana-wide default (%s) when the setting is unset', (defaultToggle) => {
    setDefaultToggle(defaultToggle);
    const dataSource = DataSourceInstanceSettingsFactory.build({ jsonData: {} });

    expect(isDataSourceManagingAlerts(dataSource)).toBe(defaultToggle);
  });
});
