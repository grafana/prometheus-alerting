import pluginJson from './plugin.json';

export const PLUGIN_BASE_URL = `/a/${pluginJson.id}`;

export enum ROUTES {
  Landing = 'landing',
  Rules = 'rules',
  Routes = 'routes',
  Receivers = 'receivers',
  Templates = 'templates',
}
