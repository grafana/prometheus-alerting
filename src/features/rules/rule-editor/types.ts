// Type definitions for cloud rule forms (data source managed rules only)

// Only cloud rule types - no Grafana-managed rules
export enum RuleFormType {
  cloudAlerting = 'cloud-alerting',
  cloudRecording = 'cloud-recording',
}

export type KVObject = { key: string; value: string };

// Simplified form values - excludes all Grafana-managed fields
export interface RuleFormValues {
  // Common fields
  name: string;
  type: RuleFormType; // Required for validation
  dataSourceUid: string | null;
  group: string;
  labels: Array<{ key: string; value: string }>;
  annotations: Array<{ key: string; value: string }>;

  // Cloud-specific fields
  namespace: string;
  expression: string;
  forTime: number;
  forTimeUnit: string;
}
