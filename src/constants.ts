import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export const STORAGE_KEYS = {
  SELECTED_ALERTMANAGER_UID: 'grafana.alertmanager.selectedDataSourceUID',
} as const;

/**
 * Links can name the Alertmanager to show with `?alertmanager=<uid>`. Grafana uses the same param on its
 * own alerting pages, and its redirect to this plugin puts the data source UID in it.
 */
export const ALERTMANAGER_QUERY_PARAM = 'alertmanager';

export const DEFAULT_PAGE_SIZE = 40;

/** Grafana's "add a new data source" page – linked from the empty states for missing data sources. */
export const NEW_DATA_SOURCE_URL = '/connections/datasources/new';

export enum ROUTES {
  Alerts = 'alerts',
  Rules = 'rules',
  RuleView = 'rules/:ruleIdentifier',
  RuleEdit = 'rules/:ruleIdentifier/edit',
  RuleNew = 'rules/new',
  GroupView = 'groups/:dataSourceUid/:namespace/:groupName',
  GroupEdit = 'groups/:dataSourceUid/:namespace/:groupName/edit',
  Routes = 'routes',
  Receivers = 'receivers',
  Templates = 'templates',
  Silences = 'silences',
  CreateSilence = 'silences/new',
  TimeIntervals = 'time-intervals',
  CreateTimeInterval = 'time-intervals/new',
  InhibitRules = 'inhibit-rules',
}

export const ERROR_ROUTES_MATCHER_CONFLICT = 'alerting.notifications.routes.conflictingMatchers' as const;
