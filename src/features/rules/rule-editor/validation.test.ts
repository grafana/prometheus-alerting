import { createRuleFormSchema, findDuplicateKeyIndexes } from './validation';
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

function issuePaths(result: ReturnType<ReturnType<typeof createRuleFormSchema>['safeParse']>) {
  if (result.success) {
    return [];
  }
  return result.error.issues.map((issue) => issue.path.join('.'));
}

function issueFor(result: ReturnType<ReturnType<typeof createRuleFormSchema>['safeParse']>, path: string) {
  if (result.success) {
    return undefined;
  }
  return result.error.issues.find((issue) => issue.path.join('.') === path);
}

describe('createRuleFormSchema duplicate key validation', () => {
  it('rejects two labels with the same key and points at the later row', () => {
    const result = createRuleFormSchema().safeParse(
      formValues({
        labels: [
          { key: 'team', value: 'backend' },
          { key: 'team', value: 'frontend' },
        ],
      })
    );

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['labels.1.key']);
    expect(issueFor(result, 'labels.1.key')?.message).toBe('This label key is already used');
  });

  it('rejects two annotations with the same key and points at the later row', () => {
    const result = createRuleFormSchema().safeParse(
      formValues({
        annotations: [
          { key: 'summary', value: 'one' },
          { key: 'summary', value: 'two' },
        ],
      })
    );

    expect(result.success).toBe(false);
    expect(issuePaths(result)).toEqual(['annotations.1.key']);
    expect(issueFor(result, 'annotations.1.key')?.message).toBe('This annotation key is already used');
  });
});

describe('findDuplicateKeyIndexes', () => {
  it('finds nothing in rows with distinct keys', () => {
    expect(
      findDuplicateKeyIndexes([
        { key: 'team', value: 'backend' },
        { key: 'severity', value: 'critical' },
      ])
    ).toEqual([]);
  });

  it('reports every repeat but not the row that introduced the key', () => {
    expect(
      findDuplicateKeyIndexes([
        { key: 'team', value: 'a' },
        { key: 'team', value: 'b' },
        { key: 'severity', value: 'critical' },
        { key: 'team', value: 'c' },
      ])
    ).toEqual([1, 3]);
  });

  it('ignores the blank rows the editor keeps around', () => {
    expect(
      findDuplicateKeyIndexes([
        { key: '', value: '' },
        { key: '  ', value: '' },
        { key: '', value: 'orphan value' },
      ])
    ).toEqual([]);
  });

  it('counts keys that differ only in surrounding spaces as the same key', () => {
    expect(
      findDuplicateKeyIndexes([
        { key: 'team', value: 'backend' },
        { key: ' team ', value: 'frontend' },
      ])
    ).toEqual([1]);
  });

  it('counts keys that differ in capitals as different, like Prometheus does', () => {
    expect(
      findDuplicateKeyIndexes([
        { key: 'team', value: 'backend' },
        { key: 'Team', value: 'frontend' },
      ])
    ).toEqual([]);
  });
});
