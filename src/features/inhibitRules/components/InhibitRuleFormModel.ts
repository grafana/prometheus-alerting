import {
  encodeObjectMatcher,
  type InhibitRule,
  type NormalizedInhibitRule,
  type ObjectMatcher,
} from '@grafana/external-alertmanager/vanilla';

import { type MatcherFieldValue, emptyMatcherFieldValue } from '../../../types/matcherFields';

export interface InhibitRuleFormData {
  sourceMatchers: MatcherFieldValue[];
  targetMatchers: MatcherFieldValue[];
  equal?: string;
}

function matcherRowsOrEmpty(matchers: ObjectMatcher[]): MatcherFieldValue[] {
  const rows = matchers.map(([name, operator, value]) => ({ name, operator, value }));
  return rows.length > 0 ? rows : [emptyMatcherFieldValue];
}

/** Maps normalized semantic matcher tuples into editable form rows. */
export function normalizedInhibitRuleToFormData(rule: NormalizedInhibitRule): InhibitRuleFormData {
  return {
    sourceMatchers: matcherRowsOrEmpty(rule.source_matchers),
    targetMatchers: matcherRowsOrEmpty(rule.target_matchers),
    equal: (rule.equal ?? []).join(', '),
  };
}

/** Converts semantic form rows to canonical Alertmanager matcher strings. */
export function formDataToInhibitRule(data: InhibitRuleFormData): InhibitRule {
  return {
    source_matchers: data.sourceMatchers.map((matcher) =>
      encodeObjectMatcher([matcher.name, matcher.operator, matcher.value])
    ),
    target_matchers: data.targetMatchers.map((matcher) =>
      encodeObjectMatcher([matcher.name, matcher.operator, matcher.value])
    ),
    equal: data.equal
      ? data.equal
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean)
      : undefined,
  };
}
