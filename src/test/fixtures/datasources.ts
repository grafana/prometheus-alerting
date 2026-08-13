/**
 * Mock datasource configurations for tests.
 */

import { DataSourceInstanceSettings, PluginType } from '@grafana/data';
import { Factory } from 'fishery';
import { AlertManagerDataSourceJsonData } from '../../types/datasources';

export const DataSourceInstanceSettingsFactory = Factory.define<DataSourceInstanceSettings>(({ sequence }) => ({
  id: sequence,
  uid: `ds-uid-${sequence}`,
  orgId: 1,
  name: `Data Source ${sequence}`,
  type: 'prometheus',
  typeName: 'Prometheus',
  typeLogoUrl: '',
  access: 'proxy',
  url: '',
  isDefault: false,
  readOnly: false,
  withCredentials: false,
  jsonData: {},
  meta: {
    id: 'prometheus',
    name: 'Prometheus',
    type: PluginType.datasource,
    builtIn: false,
    info: {
      author: { name: 'Grafana Labs' },
      description: '',
      links: [],
      logos: { small: '', large: '' },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
}));

export const BuiltInDataSourceInstanceSettingsFactory = DataSourceInstanceSettingsFactory.params({
  meta: { builtIn: true } as DataSourceInstanceSettings['meta'],
});

const AlertmanagerDataSourceInstanceSettingsFactory = Factory.define<
  DataSourceInstanceSettings<AlertManagerDataSourceJsonData>
>(() => ({
  ...DataSourceInstanceSettingsFactory.build(),
  jsonData: {},
}));

const mimirDataSourceJsonData = {
  manageAlerts: true,
  implementation: 'mimir',
};

const mimirAlertmanagerJsonData = {
  implementation: 'mimir',
} satisfies AlertManagerDataSourceJsonData;

/**
 * A mock Prometheus datasource
 */
export const mockPrometheusDs = DataSourceInstanceSettingsFactory.build({
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
      logos: {
        small: 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg',
        large: 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg',
      },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
  jsonData: {},
});

/**
 * A mock Mimir datasource with ruler API enabled
 */
export const mockMimirDs = DataSourceInstanceSettingsFactory.build({
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
      logos: {
        small: 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg',
        large: 'public/app/plugins/datasource/prometheus/img/prometheus_logo.svg',
      },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
  jsonData: mimirDataSourceJsonData,
});

/**
 * A mock Mimir Alertmanager datasource
 */
export const mockMimirAlertmanagerDs = AlertmanagerDataSourceInstanceSettingsFactory.build({
  uid: 'mimir-alertmanager-1',
  name: 'Mimir Alertmanager',
  type: 'alertmanager',
  meta: {
    id: 'alertmanager',
    name: 'Alertmanager',
    type: PluginType.datasource,
    info: {
      author: { name: 'Grafana Labs' },
      description: 'Mimir Alertmanager datasource',
      links: [],
      logos: { small: '', large: '' },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
  jsonData: mimirAlertmanagerJsonData,
});

/**
 * A mock Alertmanager datasource
 */
export const mockAlertmanagerDs = AlertmanagerDataSourceInstanceSettingsFactory.build({
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
});

/**
 * All mock datasources as a config object
 * Use this to mock @grafana/runtime config.datasources
 */
export const mockDatasourcesConfig = {
  [mockPrometheusDs.uid]: mockPrometheusDs,
  [mockMimirDs.uid]: mockMimirDs,
  [mockAlertmanagerDs.uid]: mockAlertmanagerDs,
  [mockMimirAlertmanagerDs.uid]: mockMimirAlertmanagerDs,
};
