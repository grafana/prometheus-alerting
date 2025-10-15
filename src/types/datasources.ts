import { DataSourceJsonData } from '@grafana/schema';
import { DataSourceRulesSourceIdentifier } from './rules';

export interface AlertManagerDataSourceJsonData extends DataSourceJsonData {
  implementation?: 'cortex' | 'mimir' | 'prometheus';
  handleGrafanaManagedAlerts?: boolean;
}

export type { DataSourceRulesSourceIdentifier };
