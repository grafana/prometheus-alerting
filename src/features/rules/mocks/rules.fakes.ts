import { Factory } from 'fishery';

import type { PromRuleGroupDTO } from '@grafana/external-rules/vanilla';

export const PromRuleGroupFactory = Factory.define<PromRuleGroupDTO>(({ sequence }) => ({
  name: `group-${sequence}`,
  file: `namespace-${sequence}`,
  rules: [],
  interval: 60,
}));
