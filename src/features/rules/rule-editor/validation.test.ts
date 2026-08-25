import { createRuleFormSchema } from './validation';
import { RuleFormType } from './types';

function formValues(overrides: Record<string, unknown> = {}) {
  return {
    name: 'HighErrorRate',
    type: RuleFormType.cloudAlerting,
    dataSourceUid: 'ds-uid',
    group: 'group',
    namespace: 'namespace',
    expression: 'up == 0',
    forTime: 5,
    forTimeUnit: 'm',
    labels: [],
    annotations: [],
    ...overrides,
  };
}

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

describe('createRuleFormSchema', () => {
  it('keeps keep_firing_for', () => {
    // The schema output is what gets submitted, so a value missing from the schema never reaches
    // the ruler -- even though it is set on the form
    const parsed = createRuleFormSchema().parse(formValues({ keepFiringFor: '10m' }));

    expect(parsed.keepFiringFor).toBe('10m');
  });

  it('accepts a compound keep_firing_for', () => {
    const parsed = createRuleFormSchema().parse(formValues({ keepFiringFor: '1h30m' }));

    expect(parsed.keepFiringFor).toBe('1h30m');
  });

  it('accepts an empty keep_firing_for, which means the rule has none', () => {
    const parsed = createRuleFormSchema().parse(formValues({ keepFiringFor: '' }));

    expect(parsed.keepFiringFor).toBe('');
  });

  it('rejects a keep_firing_for that is not a duration', () => {
    const result = createRuleFormSchema().safeParse(formValues({ keepFiringFor: 'ten minutes' }));

    expect(result.success).toBe(false);
  });

  it('requires a data source', () => {
    const result = createRuleFormSchema().safeParse(formValues({ dataSourceUid: null }));

    expect(result.success).toBe(false);
  });
});

function nameErrors(result: ReturnType<ReturnType<typeof createRuleFormSchema>['safeParse']>) {
  if (result.success) {
    return [];
  }
  return result.error.issues.filter((issue) => issue.path.join('.') === 'name').map((issue) => issue.message);
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

  it('flags braces separately, since that usually means a PromQL selector ended up in the name', () => {
    const result = createRuleFormSchema().safeParse(baseValues({ name: 'errors_total{job="api"}' }));

    expect(nameErrors(result)).toEqual([
      "Recording rule names can't contain braces -- did you mean to put this in the expression instead?",
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
