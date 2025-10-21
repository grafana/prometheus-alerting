import { DataSourceJsonData } from '@grafana/schema';
import { DataSourceRulesSourceIdentifier } from './rules';
import { DataSourceInstanceSettings } from '@grafana/data';

export interface AlertManagerDataSourceJsonData extends DataSourceJsonData {
  implementation?: AlertmanagerImplementation;
  handleGrafanaManagedAlerts?: boolean;
}

export type AlertmanagerDataSourceSettings = DataSourceInstanceSettings<AlertManagerDataSourceJsonData>;
export type AlertmanagerImplementation = 'cortex' | 'mimir' | 'prometheus';

export type { DataSourceRulesSourceIdentifier };
