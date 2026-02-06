/**
 * Mock datasource configurations for tests.
 */

import { DataSourceInstanceSettings, PluginType } from '@grafana/data';

/**
 * A mock Prometheus datasource
 */
export const mockPrometheusDs: Partial<DataSourceInstanceSettings> = {
  uid: 'prometheus-1',
  name: 'Prometheus',
  type: 'prometheus',
  meta: {
    id: 'prometheus',
    name: 'Prometheus',
    type: PluginType.datasource,
    info: {
      author: { name: 'Grafana Labs' },
      description: 'Prometheus datasource',
      links: [],
      logos: { small: '', large: '' },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
  jsonData: {},
};

/**
 * A mock Mimir datasource with ruler API enabled
 */
export const mockMimirDs: Partial<DataSourceInstanceSettings> = {
  uid: 'test-mimir-uid',
  name: 'Test Mimir',
  type: 'prometheus',
  meta: {
    id: 'prometheus',
    name: 'Prometheus',
    type: PluginType.datasource,
    info: {
      author: { name: 'Grafana Labs' },
      description: 'Mimir datasource',
      links: [],
      logos: { small: '', large: '' },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
  jsonData: {
    manageAlerts: true,
    implementation: 'mimir',
  } as any,
};

/**
 * A mock Alertmanager datasource
 */
export const mockAlertmanagerDs: Partial<DataSourceInstanceSettings> = {
  uid: 'alertmanager-1',
  name: 'Alertmanager',
  type: 'alertmanager',
  meta: {
    id: 'alertmanager',
    name: 'Alertmanager',
    type: PluginType.datasource,
    info: {
      author: { name: 'Grafana Labs' },
      description: 'Alertmanager datasource',
      links: [],
      logos: { small: '', large: '' },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
  jsonData: {},
};

/**
 * All mock datasources as a config object
 * Use this to mock @grafana/runtime config.datasources
 */
export const mockDatasourcesConfig = {
  [mockPrometheusDs.uid!]: mockPrometheusDs,
  [mockMimirDs.uid!]: mockMimirDs,
  [mockAlertmanagerDs.uid!]: mockAlertmanagerDs,
};
