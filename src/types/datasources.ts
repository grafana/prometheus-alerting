import { DataSourceJsonData } from '@grafana/schema';
import { DataSourceRulesSourceIdentifier } from './rules';

export interface AlertManagerDataSourceJsonData extends DataSourceJsonData {
  implementation?: AlertmanagerImplementation;
  handleGrafanaManagedAlerts?: boolean;
}

export type AlertmanagerImplementation = 'cortex' | 'mimir' | 'prometheus';

export type { DataSourceRulesSourceIdentifier };
