import { RuleFormType } from './types';

export function isCloudAlertingRuleByType(type?: RuleFormType): boolean {
  return type === RuleFormType.cloudAlerting;
}

export function isCloudRecordingRuleByType(type?: RuleFormType): boolean {
  return type === RuleFormType.cloudRecording;
}

export function isDataSourceManagedRuleByType(type?: RuleFormType): boolean {
  return isCloudAlertingRuleByType(type) || isCloudRecordingRuleByType(type);
}
