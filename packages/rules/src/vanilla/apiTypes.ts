export type PromRuleType = 'alerting' | 'recording';

export type PromAlertingRuleState = 'firing' | 'inactive' | 'pending' | 'recovering' | 'unknown';
export type PromAlertState = 'firing' | 'pending';

export type Labels = Record<string, string>;
export type Annotations = Record<string, string>;

interface PromRuleDTOBase {
  health: string;
  name: string;
  query: string; // expr
  evaluationTime?: number;
  lastEvaluation?: string;
  lastError?: string;
}

export interface PromAlertingRuleDTO extends PromRuleDTOBase {
  alerts?: Array<{
    labels: Labels;
    annotations: Annotations;
    state: PromAlertState;
    activeAt: string;
    value: string;
  }>;
  labels?: Labels;
  annotations?: Annotations;
  duration?: number; // for
  state: PromAlertingRuleState;
  type: 'alerting';
}

export interface PromRecordingRuleDTO extends PromRuleDTOBase {
  health: string;
  name: string;
  query: string; // expr
  type: 'recording';
  labels?: Labels;
}

export type PromRuleDTO = PromAlertingRuleDTO | PromRecordingRuleDTO;

export interface PromRuleGroupDTO {
  name: string;
  file: string;
  rules: PromRuleDTO[];
  interval: number;

  evaluationTime?: number; // these 2 are not in older prometheus payloads
  lastEvaluation?: string;
}

// Ruler rule DTOs (from Ruler API /api/v1/rules/*)
interface RulerRuleBaseDTO {
  expr: string;
  labels?: Labels;
}

export interface RulerRecordingRuleDTO extends RulerRuleBaseDTO {
  record: string;
}

export interface RulerAlertingRuleDTO extends RulerRuleBaseDTO {
  alert: string;
  for?: string;
  annotations?: Annotations;
  keep_firing_for?: string;
}

export type RulerRuleDTO = RulerAlertingRuleDTO | RulerRecordingRuleDTO;

export interface RulerRuleGroupDTO {
  name: string;
  interval?: string;
  rules: RulerRuleDTO[];
}
