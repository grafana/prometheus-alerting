import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export const STORAGE_KEYS = {
  SELECTED_ALERTMANAGER_UID: 'grafana.alertmanager.selectedDataSourceUID',
} as const;

export enum ROUTES {
  Landing = 'landing',
  Rules = 'rules',
  Routes = 'routes',
  Receivers = 'receivers',
  Templates = 'templates',
  Silences = 'silences',
  TimeIntervals = 'time-intervals',
  InhibitRules = 'inhibit-rules',
}
