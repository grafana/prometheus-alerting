import { getDataSourceSrv } from '@grafana/runtime';

import { DataSourceRulesSourceIdentifier } from '../types/datasources';

const SUPPORTED_PROMETHEUS_TYPES = ['prometheus', 'mimir', 'cortex', 'loki'];

/**
 * Get all external Prometheus-compatible data sources configured in Grafana
 */
export function getExternalRulesSources(): DataSourceRulesSourceIdentifier[] {
  const dataSources = getDataSourceSrv().getList({ type: SUPPORTED_PROMETHEUS_TYPES });

  return dataSources.map((ds) => ({
    name: ds.name,
    uid: ds.uid,
    ruleSourceType: 'datasource',
  }));
}
