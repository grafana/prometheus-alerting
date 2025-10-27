export type RulesSourceApplication = 'prometheus' | 'mimir' | 'cortex' | 'loki';

export interface PromBuildInfoResponse {
  status: string;
  data: {
    application?: string;
    version: string;
    revision?: string;
    branch?: string;
    buildUser?: string;
    buildDate?: string;
    goVersion?: string;
    features?: {
      ruler_config_api?: string;
      alertmanager_config_api?: string;
      query_sharding?: string;
      federated_rules?: string;
    };
  };
}

export interface DataSourceFeatures {
  application: RulesSourceApplication;
  rulerApiEnabled: boolean;
}
