import { setDataSourceSrv } from '@grafana/runtime';
import { describe, expect, it } from 'vitest';

import { DataSourceInstanceSettingsFactory } from '../../../test/fixtures/datasources';

import {
  flavors,
  getFlavor,
  getFlavorOrThrow,
  isSupportedRulesSourceType,
  supportedRulesSourceTypes,
} from './registry';

function setupSrv(list: ReturnType<typeof DataSourceInstanceSettingsFactory.buildList>) {
  setDataSourceSrv({
    getList: () => list,
    getInstanceSettings: (uid: string) => list.find((dataSource) => dataSource.uid === uid) ?? null,
    get: () => Promise.resolve({} as any),
    reload: () => Promise.resolve(),
  } as any);
}

describe('flavor paths', () => {
  it('uses the Prometheus runtime rules and query paths', () => {
    expect(flavors.prometheus.promRulesPath).toBe('api/v1/rules');
    expect(flavors.prometheus.queryPath).toBe('api/v1/query');
  });

  it('uses the Loki Prometheus-compatible rules path and LogQL query path', () => {
    expect(flavors.loki.promRulesPath).toBe('prometheus/api/v1/rules');
    expect(flavors.loki.queryPath).toBe('loki/api/v1/query');
  });
});

describe('flavor application', () => {
  it('is known up front where the plugin type settles it', () => {
    expect(flavors.loki.application).toBe('loki');
  });

  // Prometheus, Mimir, and Cortex all register as `prometheus`, so only feature discovery can tell
  // them apart -- claiming one here would mislabel the other two.
  it('is undefined for the prometheus plugin type, which is ambiguous until discovery', () => {
    expect(flavors.prometheus.application).toBeUndefined();
  });
});

describe('isSupportedRulesSourceType', () => {
  it('accepts the registered plugin types', () => {
    expect(supportedRulesSourceTypes).toEqual(['prometheus', 'loki']);
    expect(isSupportedRulesSourceType('prometheus')).toBe(true);
    expect(isSupportedRulesSourceType('loki')).toBe(true);
  });

  it('rejects other plugin types', () => {
    expect(isSupportedRulesSourceType('graphite')).toBe(false);
    expect(isSupportedRulesSourceType('')).toBe(false);
  });

  // Mimir and Cortex are not Grafana plugin types -- they register as `prometheus` and are told
  // apart at runtime by feature discovery.
  it('rejects application names that are not plugin types', () => {
    expect(isSupportedRulesSourceType('mimir')).toBe(false);
    expect(isSupportedRulesSourceType('cortex')).toBe(false);
  });
});

describe('getFlavorOrThrow', () => {
  it('resolves the flavor from the data source plugin type', () => {
    const prometheus = DataSourceInstanceSettingsFactory.build({ uid: 'prom-1', type: 'prometheus' });
    const loki = DataSourceInstanceSettingsFactory.build({ uid: 'loki-1', type: 'loki' });
    setupSrv([prometheus, loki]);

    expect(getFlavorOrThrow(prometheus.uid)).toBe(flavors.prometheus);
    expect(getFlavorOrThrow(loki.uid)).toBe(flavors.loki);
  });

  it('throws for an unsupported datasource type', () => {
    const graphite = DataSourceInstanceSettingsFactory.build({ uid: 'graphite-1', type: 'graphite' });
    setupSrv([graphite]);

    expect(() => getFlavorOrThrow(graphite.uid)).toThrow('Unsupported rules datasource type: graphite');
  });

  it('throws for an unknown datasource', () => {
    setupSrv([]);

    expect(() => getFlavorOrThrow('missing')).toThrow('Could not find datasource settings for missing');
  });
});

describe('getFlavor', () => {
  it('returns undefined instead of throwing for unsupported or missing data sources', () => {
    const graphite = DataSourceInstanceSettingsFactory.build({ uid: 'graphite-1', type: 'graphite' });
    setupSrv([graphite]);

    expect(getFlavor('graphite-1')).toBeUndefined();
    expect(getFlavor('missing')).toBeUndefined();
  });
});
