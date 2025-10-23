import { RuleFormType, RuleFormValues } from './types';

// Default evaluation interval (1 minute)
export const DEFAULT_GROUP_EVALUATION_INTERVAL = '1m';

// Get default form values for a specific rule type
export function defaultFormValuesForRuleType(type: RuleFormType): RuleFormValues {
  return Object.freeze({
    name: '',
    type,
    dataSourceName: null,
    group: '',
    labels: [{ key: '', value: '' }],
    annotations: [],
    namespace: '',
    expression: '',
    forTime: 1,
    forTimeUnit: 'm',
  });
}

// Translate route parameter to rule type
export function translateRouteParamToRuleType(param = ''): RuleFormType {
  if (param === 'recording') {
    return RuleFormType.cloudRecording;
  }
  // Default to alerting
  return RuleFormType.cloudAlerting;
}
