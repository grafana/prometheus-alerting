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
