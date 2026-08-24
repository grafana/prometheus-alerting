import type { RulerAlertingRuleDTO, RulerRecordingRuleDTO } from '@grafana/external-rules/vanilla';

import { formValuesToRulerRuleDTO, rulerRuleToFormValues } from './formTransform';
import { RuleFormType } from './types';

const alertingRule: RulerAlertingRuleDTO = {
  alert: 'HighErrorRate',
  expr: 'rate(errors[5m]) > 0.1',
  for: '5m',
  keep_firing_for: '10m',
  labels: { severity: 'critical' },
  annotations: { summary: 'Errors are high' },
};

const recordingRule: RulerRecordingRuleDTO = {
  record: 'job:errors:rate5m',
  expr: 'rate(errors[5m])',
  labels: { team: 'backend' },
};

describe('rulerRuleToFormValues', () => {
  it('reads an alerting rule, keep_firing_for included', () => {
    const values = rulerRuleToFormValues('ds-uid', 'namespace', 'group', alertingRule);

    expect(values).toMatchObject({
      name: 'HighErrorRate',
      type: RuleFormType.cloudAlerting,
      dataSourceUid: 'ds-uid',
      namespace: 'namespace',
      group: 'group',
      expression: 'rate(errors[5m]) > 0.1',
      forTime: 5,
      forTimeUnit: 'm',
      keepFiringFor: '10m',
      labels: [{ key: 'severity', value: 'critical' }],
      annotations: [{ key: 'summary', value: 'Errors are high' }],
    });
  });

  it('reads a recording rule', () => {
    const values = rulerRuleToFormValues('ds-uid', 'namespace', 'group', recordingRule);

    expect(values).toMatchObject({
      name: 'job:errors:rate5m',
      type: RuleFormType.cloudRecording,
      expression: 'rate(errors[5m])',
      annotations: [],
      labels: [{ key: 'team', value: 'backend' }],
    });
  });

  it('rejects a rule that is neither alerting nor recording', () => {
    // @ts-expect-error -- deliberately not a rule
    expect(() => rulerRuleToFormValues('ds-uid', 'namespace', 'group', { expr: 'up' })).toThrow('Unknown rule type');
  });
});

describe('formValuesToRulerRuleDTO', () => {
  it('round-trips an alerting rule without dropping keep_firing_for', () => {
    const values = rulerRuleToFormValues('ds-uid', 'namespace', 'group', alertingRule);

    // Editing the expression used to lose the resolve delay, so alerts started resolving early
    expect(formValuesToRulerRuleDTO({ ...values, expression: 'rate(errors[5m]) > 0.5' })).toEqual({
      ...alertingRule,
      expr: 'rate(errors[5m]) > 0.5',
    });
  });

  it('leaves keep_firing_for off a rule that never had one', () => {
    const values = rulerRuleToFormValues('ds-uid', 'namespace', 'group', {
      ...alertingRule,
      keep_firing_for: undefined,
    });

    expect(formValuesToRulerRuleDTO(values)).not.toHaveProperty('keep_firing_for');
  });

  it('round-trips a recording rule', () => {
    const values = rulerRuleToFormValues('ds-uid', 'namespace', 'group', recordingRule);

    expect(formValuesToRulerRuleDTO(values)).toEqual(recordingRule);
  });

  it('drops labels and annotations with a blank key or value', () => {
    const values = rulerRuleToFormValues('ds-uid', 'namespace', 'group', alertingRule);
    const rule = formValuesToRulerRuleDTO({
      ...values,
      labels: [...values.labels, { key: '', value: 'no key' }, { key: 'no value', value: '' }],
      annotations: [...values.annotations, { key: ' ', value: ' ' }],
    });

    expect(rule).toEqual(alertingRule);
  });

  it('rejects a form with an unsupported rule type', () => {
    const values = rulerRuleToFormValues('ds-uid', 'namespace', 'group', alertingRule);

    // @ts-expect-error -- deliberately not a supported type
    expect(() => formValuesToRulerRuleDTO({ ...values, type: 'grafana-alerting' })).toThrow('Unexpected rule type');
  });
});
