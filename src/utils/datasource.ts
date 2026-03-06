import { getDataSourceSrv } from '@grafana/runtime';

import { DataSourceRulesSourceIdentifier } from '../types/datasources';

const SUPPORTED_PROMETHEUS_TYPES = ['prometheus', 'loki'];

/**
 * Get all external Prometheus-compatible data sources configured in Grafana.
 * Mimir and Cortex data sources register with type 'prometheus' (implementation is stored in jsonData).
 * Built-in data sources (e.g. "-- Grafana --", "-- Mixed --") are excluded.
 */
export function getExternalRulesSources(): DataSourceRulesSourceIdentifier[] {
  const dataSources = getDataSourceSrv().getList({ type: SUPPORTED_PROMETHEUS_TYPES });

  return dataSources
    .filter((ds) => !ds.meta?.builtIn)
    .map((ds) => ({
      name: ds.name,
      uid: ds.uid,
      ruleSourceType: 'datasource',
    }));
}
