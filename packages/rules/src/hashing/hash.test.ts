import { describe, it, expect } from 'vitest';
import { simpleHash, hashLabelsOrAnnotations, hashQuery, stripPromQLComments } from './hash';

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
    expect(hashQuery('  rate(http[5m])  ')).toBe('rate(http[5m])');
  });

  it('strips comment lines', () => {
    const query = '# this is a comment\nrate(http[5m])';
    expect(hashQuery(query)).toBe('rate(http[5m])');
  });

  it('strips surrounding parentheses', () => {
    expect(hashQuery('(rate(http[5m]))')).toBe('rate(http[5m])');
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
