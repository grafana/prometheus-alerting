import {
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

/**
 * Maps normalized matcher tuples into form rows. Matcher values are editable
 * lexical tokens: surrounding quotes and escapes stay visible and are submitted
 * unchanged, so this UI does not guess Alertmanager's parser dialect.
 */
export function normalizedInhibitRuleToFormData(rule: NormalizedInhibitRule): InhibitRuleFormData {
  return {
    sourceMatchers: matcherRowsOrEmpty(rule.source_matchers),
    targetMatchers: matcherRowsOrEmpty(rule.target_matchers),
    equal: (rule.equal ?? []).join(', '),
  };
}

/**
 * Checks tokens intended for the single-line matcher value input. Blank and
 * bare tokens without quotes or surrounding whitespace are allowed; balanced
 * quoted tokens are allowed. Physical line breaks and malformed quotes are rejected.
 */
export function isEditableMatcherValueToken(value: string): boolean {
  if (value === '') {
    return true;
  }

  if (/\r|\n/.test(value)) {
    return false;
  }

  if (!value.startsWith('"')) {
    return !value.includes('"') && value.trim() === value;
  }

  if (!value.endsWith('"') || value.length < 2) {
    return false;
  }

  let escaped = false;
  for (let index = 1; index < value.length - 1; index++) {
    const character = value[index];
    if (escaped) {
      escaped = false;
    } else if (character === '\\') {
      escaped = true;
    } else if (character === '"') {
      return false;
    }
  }

  return !escaped;
}

export function hasUnsupportedCarriageReturn(rule: NormalizedInhibitRule): boolean {
  return [...rule.source_matchers, ...rule.target_matchers].some(([, , value]) => value.includes('\r'));
}

function encodeMatcher({ name, operator, value }: MatcherFieldValue): string {
  return `${name}${operator}${value || '""'}`;
}

/**
 * Converts structured form rows to Alertmanager matcher strings. Values are raw
 * matcher tokens; a blank new row is encoded as an empty quoted value.
 */
export function formDataToInhibitRule(data: InhibitRuleFormData): InhibitRule {
  return {
    source_matchers: data.sourceMatchers.map(encodeMatcher),
    target_matchers: data.targetMatchers.map(encodeMatcher),
    equal: data.equal
      ? data.equal
          .split(',')
          .map((label) => label.trim())
          .filter(Boolean)
      : undefined,
  };
}
