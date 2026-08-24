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
  /**
   * `keep_firing_for` on the rule, kept exactly as the ruler returned it.
   *
   * There is no form field for it — like Grafana, we read it and write it back so editing a rule
   * doesn't drop it. It stays a raw duration string rather than a number and a unit because
   * Prometheus accepts compound durations like `1h30m`, and splitting one apart just to put it
   * back together is a good way to lose it.
   */
  keepFiringFor?: string;
}
