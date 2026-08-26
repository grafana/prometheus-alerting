import { DataSourceInstanceSettings } from '@grafana/data';
import { config, getDataSourceSrv } from '@grafana/runtime';

import { supportedRulesSourceTypes } from '../api/rules/flavors/registry';
import { DataSourceRulesSourceIdentifier } from '../types/datasources';

/**
 * Whether this data source's alert rules belong in the alerting UI at all.
 *
 * "Manage alerts via Alerting UI" is the switch admins use to keep a data source out — usually
 * because it has no Ruler, or because something else owns its rules. A data source where nobody
 * touched the switch falls back to the Grafana-wide default.
 */
export function isDataSourceManagingAlerts(dataSource: DataSourceInstanceSettings): boolean {
  return dataSource.jsonData.manageAlerts ?? config.defaultDatasourceManageAlertsUiToggle;
}

/**
 * Get all external Prometheus-compatible data sources configured in Grafana.
 * Mimir and Cortex data sources register with type 'prometheus' (implementation is stored in jsonData).
 * Built-in data sources (e.g. "-- Grafana --", "-- Mixed --") are excluded, as are data sources
 * an admin has taken out of the alerting UI — see {@link isDataSourceManagingAlerts}.
 */
export function getExternalRulesSources(): DataSourceRulesSourceIdentifier[] {
  const dataSources = getDataSourceSrv().getList({ type: supportedRulesSourceTypes });

  return dataSources
    .filter((ds) => !ds.meta?.builtIn)
    .filter(isDataSourceManagingAlerts)
    .map((ds) => ({
      name: ds.name,
      uid: ds.uid,
      ruleSourceType: 'datasource',
    }));
}
