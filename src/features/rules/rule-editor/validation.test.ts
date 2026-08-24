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
  it('keeps keep_firing_for, which has no form field of its own', () => {
    // The schema output is what gets submitted, so a value missing from the schema never reaches
    // the ruler -- even though it is set on the form
    const parsed = createRuleFormSchema().parse(formValues({ keepFiringFor: '10m' }));

    expect(parsed.keepFiringFor).toBe('10m');
  });

  it('requires a data source', () => {
    const result = createRuleFormSchema().safeParse(formValues({ dataSourceUid: null }));

    expect(result.success).toBe(false);
  });
});
