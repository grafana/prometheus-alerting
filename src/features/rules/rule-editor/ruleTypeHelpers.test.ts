import {
  isCloudAlertingRuleByType,
  isCloudRecordingRuleByType,
  isDataSourceManagedRuleByType,
} from './ruleTypeHelpers';
import { RuleFormType } from './types';

describe('isCloudAlertingRuleByType', () => {
  it('returns true for cloudAlerting', () => {
    expect(isCloudAlertingRuleByType(RuleFormType.cloudAlerting)).toBe(true);
  });

  it('returns false for cloudRecording', () => {
    expect(isCloudAlertingRuleByType(RuleFormType.cloudRecording)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isCloudAlertingRuleByType(undefined)).toBe(false);
  });
});

describe('isCloudRecordingRuleByType', () => {
  it('returns true for cloudRecording', () => {
    expect(isCloudRecordingRuleByType(RuleFormType.cloudRecording)).toBe(true);
  });

  it('returns false for cloudAlerting', () => {
    expect(isCloudRecordingRuleByType(RuleFormType.cloudAlerting)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isCloudRecordingRuleByType(undefined)).toBe(false);
  });
});

describe('isDataSourceManagedRuleByType', () => {
  it('returns true for cloudAlerting', () => {
    expect(isDataSourceManagedRuleByType(RuleFormType.cloudAlerting)).toBe(true);
  });

  it('returns true for cloudRecording', () => {
    expect(isDataSourceManagedRuleByType(RuleFormType.cloudRecording)).toBe(true);
  });

  it('returns false for undefined', () => {
    expect(isDataSourceManagedRuleByType(undefined)).toBe(false);
  });
});
