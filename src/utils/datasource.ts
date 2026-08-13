import { getDataSourceSrv } from '@grafana/runtime';

import { supportedRulesSourceTypes } from '../api/rules/flavors/registry';
import { DataSourceRulesSourceIdentifier } from '../types/datasources';

/**
 * Get all external Prometheus-compatible data sources configured in Grafana.
 * Mimir and Cortex data sources register with type 'prometheus' (implementation is stored in jsonData).
 * Built-in data sources (e.g. "-- Grafana --", "-- Mixed --") are excluded.
 */
export function getExternalRulesSources(): DataSourceRulesSourceIdentifier[] {
  const dataSources = getDataSourceSrv().getList({ type: supportedRulesSourceTypes });

  return dataSources
    .filter((ds) => !ds.meta?.builtIn)
    .map((ds) => ({
      name: ds.name,
      uid: ds.uid,
      ruleSourceType: 'datasource',
    }));
}
