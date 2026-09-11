import {
  encodeSemanticInhibitMatcher,
  type InhibitRule,
  type NormalizedInhibitRule,
  type SemanticInhibitMatcher,
} from '@grafana/external-alertmanager/vanilla';

import { type MatcherFieldValue, emptyMatcherFieldValue } from '../../../types/matcherFields';

export interface InhibitRuleFormData {
  sourceMatchers: MatcherFieldValue[];
  targetMatchers: MatcherFieldValue[];
  equal?: string;
}

function matcherRowsOrEmpty(matchers: SemanticInhibitMatcher[]): MatcherFieldValue[] {
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

/**
 * Browser form controls cannot preserve every semantic matcher line break:
 * Inputs strip line breaks from names, and TextAreas normalize CR/CRLF values to LF.
 */
export function containsUnsupportedMatcherLineBreak(rule: NormalizedInhibitRule): boolean {
  return [...rule.source_matchers, ...rule.target_matchers].some(
    ([name, , value]) => name.includes('\n') || name.includes('\r') || value.includes('\r')
  );
}

/** Converts semantic form rows to canonical Alertmanager matcher strings. */
export function formDataToInhibitRule(data: InhibitRuleFormData): InhibitRule {
  return {
    source_matchers: data.sourceMatchers.map((matcher) =>
      encodeSemanticInhibitMatcher([matcher.name, matcher.operator, matcher.value])
    ),
    target_matchers: data.targetMatchers.map((matcher) =>
      encodeSemanticInhibitMatcher([matcher.name, matcher.operator, matcher.value])
    ),
    equal: data.equal
      ? data.equal
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean)
      : undefined,
  };
}
