import { describe, it, expect } from 'vitest';

import { createRulePositionHash, getMatchingRulerRule, getMatchingPromRule } from './matching';
import type { PromRuleDTO, RulerRuleDTO } from './vanilla/api';

const promRule = (overrides: Partial<PromRuleDTO> = {}): PromRuleDTO => ({
  name: 'HighErrorRate',
  type: 'alerting',
  health: 'ok',
  state: 'inactive',
  query: 'up == 0',
  labels: { severity: 'warning' },
  ...overrides,
});

const rulerRule = (overrides: Partial<RulerRuleDTO> = {}): RulerRuleDTO =>
  ({
    alert: 'HighErrorRate',
    expr: 'up == 0',
    labels: { severity: 'warning' },
    ...overrides,
  }) as RulerRuleDTO;

/**
 * Regression tests for the rules-list duplicate-name bug found during a live bug-bash session:
 * when a rule group contains multiple rules sharing an identical name (a valid, if unusual, Ruler
 * API configuration), `getMatchingRulerRule` could fail to uniquely disambiguate them and return
 * `undefined` -- which caused `RuleActionsButtons.tsx` to silently render the affected rule
 * read-only (no Edit button), even though the group was fully editable.
 *
 * Fixed by backporting the position-hash tiebreak from grafana/grafana#112407: when name, labels,
 * annotations, and query are all identical, the rule's position within its group (encoded as
 * "<index>:<totalRules>") is used as a final disambiguator. This only succeeds when both the
 * Prometheus-side and Ruler-side groups have the same number of rules, so it never produces a
 * false match when the two sides have diverged structurally.
 */
describe('getMatchingRulerRule', () => {
  it('matches by unique name when only one ruler rule has that name', () => {
    const rulerRules = [rulerRule({ alert: 'HighErrorRate' }), rulerRule({ alert: 'OtherRule' })];
    const result = getMatchingRulerRule(rulerRules, promRule({ name: 'HighErrorRate' }));
    expect(result).toBe(rulerRules[0]);
  });

  it('returns undefined when no ruler rule has a matching name', () => {
    const rulerRules = [rulerRule({ alert: 'OtherRule' })];
    const result = getMatchingRulerRule(rulerRules, promRule({ name: 'HighErrorRate' }));
    expect(result).toBeUndefined();
  });

  it('resolves a name collision via the labels+annotations fingerprint', () => {
    const target = rulerRule({ alert: 'Dup', labels: { team: 'platform' } });
    const other = rulerRule({ alert: 'Dup', labels: { team: 'sre' } });
    const rulerRules = [other, target];

    const result = getMatchingRulerRule(rulerRules, promRule({ name: 'Dup', labels: { team: 'platform' } }));
    expect(result).toBe(target);
  });

  it('resolves a name+label collision via the query fingerprint as a last resort', () => {
    const target = rulerRule({ alert: 'Dup', labels: { team: 'platform' }, expr: 'up == 0' });
    const other = rulerRule({ alert: 'Dup', labels: { team: 'platform' }, expr: 'up == 1' });
    const rulerRules = [other, target];

    const result = getMatchingRulerRule(
      rulerRules,
      promRule({ name: 'Dup', labels: { team: 'platform' }, query: 'up == 0' })
    );
    expect(result).toBe(target);
  });

  it('returns undefined for a fully ambiguous duplicate when no position hash is given', () => {
    const rulerRules = [
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
    ];

    const result = getMatchingRulerRule(
      rulerRules,
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' })
    );
    expect(result).toBeUndefined();
  });

  it('resolves a fully ambiguous duplicate at position 0 via the position hash', () => {
    const rulerRules = [
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
    ];

    const result = getMatchingRulerRule(
      rulerRules,
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' }),
      createRulePositionHash(0, 2)
    );
    expect(result).toBe(rulerRules[0]);
  });

  it('resolves the middle rule of three fully ambiguous duplicates via the position hash', () => {
    const rulerRules = [
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
    ];

    const result = getMatchingRulerRule(
      rulerRules,
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' }),
      createRulePositionHash(1, 3)
    );
    expect(result).toBe(rulerRules[1]);
    expect(result).not.toBe(rulerRules[0]);
    expect(result).not.toBe(rulerRules[2]);
  });

  it('does not match via position hash when the group sizes differ', () => {
    const rulerRules = [
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
    ];

    // The prom-side group only has 2 rules ("0:2"), but the ruler-side group has 3 -- a structural
    // mismatch, so position matching must not fall back to a guess.
    const result = getMatchingRulerRule(
      rulerRules,
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' }),
      createRulePositionHash(0, 2)
    );
    expect(result).toBeUndefined();
  });

  it('matches recording rules by name', () => {
    const rulerRules = [{ record: 'job:requests:rate5m', expr: 'sum(rate(x[5m]))' } as RulerRuleDTO];
    const result = getMatchingRulerRule(
      rulerRules,
      promRule({ name: 'job:requests:rate5m', type: 'recording', state: undefined, query: 'sum(rate(x[5m]))' })
    );
    expect(result).toBe(rulerRules[0]);
  });
});

describe('getMatchingPromRule (inverse direction)', () => {
  it('matches by unique name when only one prometheus rule has that name', () => {
    const promRules = [promRule({ name: 'HighErrorRate' }), promRule({ name: 'OtherRule' })];
    const result = getMatchingPromRule(promRules, rulerRule({ alert: 'HighErrorRate' }));
    expect(result).toBe(promRules[0]);
  });

  it('returns undefined when no prometheus rule has a matching name', () => {
    const promRules = [promRule({ name: 'OtherRule' })];
    const result = getMatchingPromRule(promRules, rulerRule({ alert: 'HighErrorRate' }));
    expect(result).toBeUndefined();
  });

  it('returns undefined for a fully ambiguous duplicate when no position hash is given', () => {
    const promRules = [
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' }),
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' }),
    ];

    const result = getMatchingPromRule(
      promRules,
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' })
    );
    expect(result).toBeUndefined();
  });

  it('resolves a fully ambiguous duplicate via the position hash', () => {
    const promRules = [
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' }),
      promRule({ name: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, query: 'up == 0' }),
    ];

    const result = getMatchingPromRule(
      promRules,
      rulerRule({ alert: 'AmbiguousDuplicateRule', labels: { team: 'platform' }, expr: 'up == 0' }),
      createRulePositionHash(1, 2)
    );
    expect(result).toBe(promRules[1]);
  });
});
