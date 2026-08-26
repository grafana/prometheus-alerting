import { GetRulerRuleGroupApiResponseSchema, RulerRuleGroupDTOSchema } from './api';

const federatedGroup = {
  name: 'federated-group',
  interval: '1m',
  limit: 10,
  query_offset: '2m',
  evaluation_delay: '3m',
  source_tenants: ['tenant-a', 'tenant-b'],
  align_evaluation_time_on_interval: true,
  rules: [{ alert: 'HighErrorRate', expr: 'up == 0', for: '5m' }],
};

describe('RulerRuleGroupDTOSchema', () => {
  it('keeps the group settings the plugin has no form field for', () => {
    // These are dropped on the way in if they are not in the schema, and the group is then
    // written back without them -- a federated group quietly becomes single-tenant
    expect(RulerRuleGroupDTOSchema.parse(federatedGroup)).toEqual(federatedGroup);
  });

  it('accepts a group with nothing but a name and rules', () => {
    expect(RulerRuleGroupDTOSchema.parse({ name: 'minimal', rules: [] })).toEqual({ name: 'minimal', rules: [] });
  });

  it('rejects a group whose settings have the wrong type', () => {
    expect(RulerRuleGroupDTOSchema.safeParse({ ...federatedGroup, source_tenants: 'tenant-a' }).success).toBe(false);
    expect(RulerRuleGroupDTOSchema.safeParse({ ...federatedGroup, limit: '10' }).success).toBe(false);
  });
});

describe('GetRulerRuleGroupApiResponseSchema', () => {
  it('accepts an empty response, which is how a backend reports an absent group', () => {
    expect(GetRulerRuleGroupApiResponseSchema.parse(null)).toBeNull();
  });
});
