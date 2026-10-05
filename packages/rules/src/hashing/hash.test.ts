import { describe, it, expect } from '@rstest/core';
import { simpleHash, hashLabelsOrAnnotations, hashQuery, normalizePromQLDurations, stripPromQLComments } from './hash';

describe('simpleHash', () => {
  it('returns 0 for empty string', () => {
    expect(simpleHash('')).toBe(0);
  });

  it('returns a non-zero number for non-empty string', () => {
    expect(simpleHash('hello')).not.toBe(0);
  });

  it('returns the same hash for the same input', () => {
    expect(simpleHash('test')).toBe(simpleHash('test'));
  });

  it('returns different hashes for different inputs', () => {
    expect(simpleHash('abc')).not.toBe(simpleHash('xyz'));
  });

  it('returns a 32-bit integer', () => {
    const hash = simpleHash('some long string with many characters to test overflow');
    expect(Number.isInteger(hash)).toBe(true);
    // 32-bit int range
    expect(hash).toBeGreaterThanOrEqual(-(2 ** 31));
    expect(hash).toBeLessThanOrEqual(2 ** 31 - 1);
  });
});

describe('hashLabelsOrAnnotations', () => {
  it('returns sorted JSON string for a labels object', () => {
    const result = hashLabelsOrAnnotations({ severity: 'critical', env: 'prod' });
    // Keys should be sorted alphabetically
    expect(result).toBe(
      JSON.stringify([
        ['env', 'prod'],
        ['severity', 'critical'],
      ])
    );
  });

  it('returns empty array JSON for undefined input', () => {
    expect(hashLabelsOrAnnotations(undefined)).toBe('[]');
  });

  it('returns empty array JSON for empty object', () => {
    expect(hashLabelsOrAnnotations({})).toBe('[]');
  });

  it('produces the same result regardless of key insertion order', () => {
    const a = hashLabelsOrAnnotations({ b: '2', a: '1' });
    const b = hashLabelsOrAnnotations({ a: '1', b: '2' });
    expect(a).toBe(b);
  });
});

describe('hashQuery', () => {
  it('returns the query trimmed', () => {
    // durations come back as milliseconds, see normalizePromQLDurations
    expect(hashQuery('  rate(http[5m])  ')).toBe('rate(http[300000ms])');
  });

  it('strips comment lines', () => {
    const query = '# this is a comment\nrate(http[5m])';
    expect(hashQuery(query)).toBe('rate(http[300000ms])');
  });

  it('strips surrounding parentheses', () => {
    expect(hashQuery('(rate(http[5m]))')).toBe('rate(http[300000ms])');
  });

  it('does not strip parens when query is a single character', () => {
    // The condition is query.length > 1, so a lone '(' is left untouched
    expect(hashQuery('(')).toBe('(');
  });

  it('returns empty string for empty input', () => {
    expect(hashQuery('')).toBe('');
  });

  it('handles multi-line query by joining non-comment lines', () => {
    const query = 'up\n# ignored\n== 1';
    expect(hashQuery(query)).toBe('up\n== 1');
  });

  it('should strip inline comments (# after code on the same line)', () => {
    const query1 = `max by (service) (up{env="production"}) # production fallback
or # combine with staging
max by (service) (up{env="staging"}) * 0.8`;
    // query2 has the same expressions across multiple lines but without comments
    const query2 = `max by (service) (up{env="production"})
or
max by (service) (up{env="staging"}) * 0.8`;

    expect(hashQuery(query1)).toBe(hashQuery(query2));
  });

  it('should strip mixed full-line and inline comments', () => {
    const query1 = `# Full-line comment
max by (environment, namespace, service) (service_condition{environment="production"}) # inline comment
or
# Another full-line comment
max by (environment, namespace, service) (service_condition{environment!="production"})`;
    // query2 has the same expressions but without any comments
    const query2 = `max by (environment, namespace, service) (service_condition{environment="production"})
or
max by (environment, namespace, service) (service_condition{environment!="production"})`;

    expect(hashQuery(query1)).toBe(hashQuery(query2));
  });

  it('should produce the same hash for equivalent durations written with different units', () => {
    expect(hashQuery('sum_over_time(up[60m:])')).toBe(hashQuery('sum_over_time(up[1h:])'));
    expect(hashQuery('rate(requests_total[90m])')).toBe(hashQuery('rate(requests_total[1h30m])'));
    expect(hashQuery('rate(requests_total[3600s])')).toBe(hashQuery('rate(requests_total[1h])'));
    expect(hashQuery('up offset 60m')).toBe(hashQuery('up offset 1h'));
  });

  it('should still produce different hashes for durations that are not equivalent', () => {
    expect(hashQuery('rate(requests_total[5m])')).not.toBe(hashQuery('rate(requests_total[6m])'));
  });

  it('should still produce different hashes for rules that differ only in a duration-shaped label', () => {
    expect(hashQuery('slo_burn{window="60m"}')).not.toBe(hashQuery('slo_burn{window="1h"}'));
  });

  it('should produce the same hash for a ruler expr and a Prometheus query that rewrote its durations', () => {
    const rulerExpr = `((sum_over_time((service_signal{check="success",sensitivity="high"} < bool 100)[4m:]) >= bool 4 or sum_over_time((service_signal{check="success",sensitivity="low"} < bool 100)[60m:]) >= bool 60) > bool 0) * 4`;
    const promQuery = `((sum_over_time((service_signal{check="success",sensitivity="high"} < bool 100)[4m:]) >= bool 4 or sum_over_time((service_signal{check="success",sensitivity="low"} < bool 100)[1h:]) >= bool 60) > bool 0) * 4`;

    expect(hashQuery(rulerExpr)).toBe(hashQuery(promQuery));
  });
});

describe('normalizePromQLDurations', () => {
  it('should rewrite durations to milliseconds', () => {
    expect(normalizePromQLDurations('rate(up[5m])')).toBe('rate(up[300000ms])');
    expect(normalizePromQLDurations('rate(up[1h])')).toBe('rate(up[3600000ms])');
    expect(normalizePromQLDurations('rate(up[500ms])')).toBe('rate(up[500ms])');
  });

  it('should add up multi-part durations', () => {
    expect(normalizePromQLDurations('rate(up[1h30m])')).toBe('rate(up[5400000ms])');
  });

  it('should rewrite both parts of a subquery', () => {
    expect(normalizePromQLDurations('sum_over_time(up[60m:5m])')).toBe('sum_over_time(up[3600000ms:300000ms])');
  });

  it('should leave a duration-looking suffix inside a longer name alone', () => {
    expect(normalizePromQLDurations('job:latency:rate5m')).toBe('job:latency:rate5m');
    expect(normalizePromQLDurations('requests_5m_total')).toBe('requests_5m_total');
  });

  it('should leave plain numbers alone', () => {
    expect(normalizePromQLDurations('up > bool 100')).toBe('up > bool 100');
  });

  it('should not read the tail of a decimal as a duration', () => {
    expect(normalizePromQLDurations('up > bool 0.5m')).toBe('up > bool 0.5m');
  });

  it('should leave a query without durations unchanged', () => {
    expect(normalizePromQLDurations('max by (cluster) (up)')).toBe('max by (cluster) (up)');
  });

  it('should leave a duration-shaped label value alone', () => {
    // A burn-rate rule labels each window, and `{window="60m"}` and `{window="1h"}` are different
    // series - rewriting inside the quotes would make two unrelated rules look like one.
    expect(normalizePromQLDurations('slo_burn{window="60m"}')).toBe('slo_burn{window="60m"}');
    expect(normalizePromQLDurations('label_replace(up, "window", "30d", "", "")')).toBe(
      'label_replace(up, "window", "30d", "", "")'
    );
  });

  it('should leave duration-shaped values in single-quoted and backtick strings alone', () => {
    expect(normalizePromQLDurations("slo_burn{window='60m'}")).toBe("slo_burn{window='60m'}");
    expect(normalizePromQLDurations('slo_burn{window=`60m`}')).toBe('slo_burn{window=`60m`}');
  });

  it('should still rewrite the durations outside a quoted string', () => {
    expect(normalizePromQLDurations('rate(slo_burn{window="60m"}[5m])')).toBe('rate(slo_burn{window="60m"}[300000ms])');
  });

  it('should not be thrown off by an escaped quote inside a string', () => {
    expect(normalizePromQLDurations('rate(up{note="say \\"60m\\""}[5m])')).toBe(
      'rate(up{note="say \\"60m\\""}[300000ms])'
    );
  });
});

describe('stripPromQLComments', () => {
  it('should strip full-line comments', () => {
    expect(stripPromQLComments('# comment\nmetric')).toBe('metric');
  });

  it('should strip inline comments', () => {
    expect(stripPromQLComments('metric or # fallback\nother_metric')).toBe('metric or\nother_metric');
  });

  it('should strip mixed full-line and inline comments', () => {
    const input = `# header comment
max by (service) (up{env="production"}) # inline
or
# another full-line
max by (service) (up{env="staging"})`;
    const expected = `max by (service) (up{env="production"})
or
max by (service) (up{env="staging"})`;
    expect(stripPromQLComments(input)).toBe(expected);
  });

  it('should return empty string for a comment-only query', () => {
    expect(stripPromQLComments('# just a comment')).toBe('');
  });

  it('should return the query unchanged when there are no comments', () => {
    expect(stripPromQLComments('rate(requests_total[5m])')).toBe('rate(requests_total[5m])');
  });

  it('should collapse lines that become empty after comment removal', () => {
    const input = `metric1
# this whole line is a comment
metric2`;
    expect(stripPromQLComments(input)).toBe('metric1\nmetric2');
  });
});
