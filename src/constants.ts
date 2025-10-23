import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export const STORAGE_KEYS = {
  SELECTED_ALERTMANAGER_UID: 'grafana.alertmanager.selectedDataSourceUID',
} as const;

export const DEFAULT_PAGE_SIZE = 40;

export enum ROUTES {
  Landing = 'landing',
  Rules = 'rules',
  RuleView = 'rules/:ruleIdentifier',
  RuleEdit = 'rules/:ruleIdentifier/edit',
  RuleNew = 'rules/new',
  Routes = 'routes',
  Receivers = 'receivers',
  Templates = 'templates',
  Silences = 'silences',
  CreateSilence = 'silences/new',
  EditSilence = 'silences/:id/edit',
  TimeIntervals = 'time-intervals',
  CreateTimeInterval = 'time-intervals/new',
  InhibitRules = 'inhibit-rules',
}

export const ERROR_ROUTES_MATCHER_CONFLICT = 'alerting.notifications.routes.conflictingMatchers' as const;
