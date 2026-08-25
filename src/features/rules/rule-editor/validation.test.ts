import { createRuleFormSchema } from './validation';
import { RuleFormType } from './types';

function baseValues(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    name: 'my_recording_rule',
    type: RuleFormType.cloudRecording,
    dataSourceUid: 'abc-123',
    group: 'group-1',
    namespace: 'namespace-1',
    expression: 'up',
    forTime: 0,
    forTimeUnit: 'm',
    labels: [],
    annotations: [],
    ...overrides,
  };
}

type SchemaResult = ReturnType<ReturnType<typeof createRuleFormSchema>['safeParse']>;

function errorsAt(result: SchemaResult, path: string) {
  if (result.success) {
    return [];
  }
  return result.error.issues.filter((issue) => issue.path.join('.') === path).map((issue) => issue.message);
}

function nameErrors(result: SchemaResult) {
  return errorsAt(result, 'name');
}

describe('createRuleFormSchema recording rule name validation', () => {
  it('accepts a metric-name-shaped recording rule name', () => {
    const result = createRuleFormSchema().safeParse(baseValues({ name: 'my:recording_rule2' }));

    expect(result.success).toBe(true);
  });

  it('rejects a recording rule name starting with a digit', () => {
    const result = createRuleFormSchema().safeParse(baseValues({ name: '2xx_ratio' }));

    expect(nameErrors(result)).toEqual([
      "Recording rule names can only contain letters, numbers, underscores and colons, and can't start with a number",
    ]);
  });

  it('rejects a recording rule name with a space, since Mimir would reject it too', () => {
    const result = createRuleFormSchema().safeParse(baseValues({ name: 'my recording rule' }));

    expect(nameErrors(result)).toEqual([
      "Recording rule names can only contain letters, numbers, underscores and colons, and can't start with a number",
    ]);
  });

  it('rejects a name with braces, e.g. a PromQL selector pasted in by mistake', () => {
    const result = createRuleFormSchema().safeParse(baseValues({ name: 'errors_total{job="api"}' }));

    expect(nameErrors(result)).toEqual([
      "Recording rule names can only contain letters, numbers, underscores and colons, and can't start with a number",
    ]);
  });

  it('does not apply the metric-name check to alerting rules', () => {
    const result = createRuleFormSchema().safeParse(
      baseValues({ type: RuleFormType.cloudAlerting, name: 'High error rate!' })
    );

    expect(nameErrors(result)).toEqual([]);
  });

  it('does not pile a metric-name error onto an already-empty name', () => {
    const result = createRuleFormSchema().safeParse(baseValues({ name: '' }));

    expect(nameErrors(result)).toEqual(['Rule name is required']);
  });
});

describe('createRuleFormSchema alerting rule template validation', () => {
  const templateError = "This value has a '{{' or '}}' that doesn't have a match -- check the template syntax";

  it('accepts balanced templates in labels and annotations', () => {
    const result = createRuleFormSchema().safeParse(
      baseValues({
        type: RuleFormType.cloudAlerting,
        name: 'HighErrorRate',
        labels: [{ key: 'severity', value: '{{ $labels.severity }}' }],
        annotations: [{ key: 'summary', value: '{{ $labels.instance }} is down' }],
      })
    );

    expect(result.success).toBe(true);
  });

  it('flags an annotation value with an unclosed template', () => {
    const result = createRuleFormSchema().safeParse(
      baseValues({
        type: RuleFormType.cloudAlerting,
        name: 'HighErrorRate',
        annotations: [{ key: 'summary', value: '{{ $labels.instance }} on {{ $labels.job' }],
      })
    );

    expect(errorsAt(result, 'annotations.0.value')).toEqual([templateError]);
  });

  it('flags a label value with an unclosed template', () => {
    const result = createRuleFormSchema().safeParse(
      baseValues({
        type: RuleFormType.cloudAlerting,
        name: 'HighErrorRate',
        labels: [{ key: 'severity', value: '{{ $labels.severity' }],
      })
    );

    expect(errorsAt(result, 'labels.0.value')).toEqual([templateError]);
  });

  it('does not check template syntax for recording rules', () => {
    const result = createRuleFormSchema().safeParse(
      baseValues({
        type: RuleFormType.cloudRecording,
        name: 'my_recording_rule',
        labels: [{ key: 'severity', value: '{{ unclosed' }],
      })
    );

    expect(errorsAt(result, 'labels.0.value')).toEqual([]);
  });
});
