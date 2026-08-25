import type { RulerRuleDTO, RulerAlertingRuleDTO, RulerRecordingRuleDTO } from '@grafana/external-rules/vanilla';
import { RuleFormType, RuleFormValues, KVObject } from './types';
import { defaultFormValuesForRuleType } from './formDefaults';

// Convert form values to RulerRuleDTO for API submission
export function formValuesToRulerRuleDTO(values: RuleFormValues): RulerRuleDTO {
  const { name, expression, forTime, forTimeUnit, keepFiringFor, type } = values;

  const annotations = arrayToRecord(cleanAnnotations(values.annotations));
  const labels = arrayToRecord(cleanLabels(values.labels));

  if (type === RuleFormType.cloudAlerting) {
    const alertingRule: RulerAlertingRuleDTO = {
      alert: name,
      for: `${forTime}${forTimeUnit}`,
      annotations,
      labels,
      expr: expression,
      // Left off when the field is empty, so clearing it removes it from the rule
      ...(keepFiringFor ? { keep_firing_for: keepFiringFor } : {}),
    };
    return alertingRule;
  } else if (type === RuleFormType.cloudRecording) {
    const recordingRule: RulerRecordingRuleDTO = {
      record: name,
      labels,
      expr: expression,
    };
    return recordingRule;
  }

  throw new Error(`Unexpected rule type: ${type}`);
}

// Convert RulerRuleDTO to form values for editing
export function rulerRuleToFormValues(
  ruleSourceUid: string,
  namespace: string,
  groupName: string,
  rule: RulerRuleDTO
): RuleFormValues {
  const defaultFormValues = defaultFormValuesForRuleType(RuleFormType.cloudAlerting);

  // Check if it's an alerting rule
  if ('alert' in rule) {
    const forDuration = parsePrometheusDuration(rule.for || '0s');

    return {
      ...defaultFormValues,
      name: rule.alert,
      type: RuleFormType.cloudAlerting,
      dataSourceUid: ruleSourceUid,
      group: groupName,
      namespace,
      expression: rule.expr,
      forTime: forDuration.value,
      forTimeUnit: forDuration.unit,
      keepFiringFor: rule.keep_firing_for ?? '',
      annotations: listifyLabelsOrAnnotations(rule.annotations, false),
      labels: listifyLabelsOrAnnotations(rule.labels, true),
    };
  }

  // Check if it's a recording rule
  if ('record' in rule) {
    return {
      ...defaultFormValues,
      name: rule.record,
      type: RuleFormType.cloudRecording,
      dataSourceUid: ruleSourceUid,
      group: groupName,
      namespace,
      expression: rule.expr,
      forTime: 0,
      forTimeUnit: 's',
      annotations: [], // Recording rules don't have annotations
      labels: listifyLabelsOrAnnotations(rule.labels, true),
    };
  }

  throw new Error('Unknown rule type');
}

// Convert labels/annotations object to key-value array
export function listifyLabelsOrAnnotations(item: Record<string, string> | undefined, addEmpty: boolean): KVObject[] {
  const list = Object.entries(item ?? {}).map(([key, value]) => ({ key, value }));
  if (addEmpty && list.length === 0) {
    list.push({ key: '', value: '' });
  }
  return list;
}

// Convert key-value array to object
export function arrayToRecord(kvArray: KVObject[]): Record<string, string> {
  return kvArray.reduce(
    (acc, { key, value }) => {
      if (key) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

// Remove empty annotations
export function cleanAnnotations(kvs: KVObject[]): KVObject[] {
  return kvs.filter((kv) => kv.key.trim() !== '' && kv.value.trim() !== '');
}

// Remove empty labels
export function cleanLabels(kvs: KVObject[]): KVObject[] {
  return kvs.filter((kv) => kv.key.trim() !== '' && kv.value.trim() !== '');
}

// Parse Prometheus duration string (e.g., "5m", "1h", "30s")
function parsePrometheusDuration(duration: string): { value: number; unit: string } {
  const match = duration.match(/^(\d+)([smhdw])$/);
  if (match) {
    return {
      value: parseInt(match[1], 10),
      unit: match[2],
    };
  }
  // Default to 0s if parsing fails
  return { value: 0, unit: 's' };
}
