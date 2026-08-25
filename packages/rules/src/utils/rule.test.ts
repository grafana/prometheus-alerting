import { isValidMetricName } from './rule';

describe('isValidMetricName', () => {
  it('accepts letters, digits, underscores and colons', () => {
    expect(isValidMetricName('my:recording_rule2')).toBe(true);
  });

  it('rejects a name starting with a digit', () => {
    expect(isValidMetricName('2xx_ratio')).toBe(false);
  });

  it('rejects a name with a space', () => {
    expect(isValidMetricName('my recording rule')).toBe(false);
  });

  it('rejects a name with braces, e.g. a PromQL selector pasted in by mistake', () => {
    expect(isValidMetricName('errors_total{job="api"}')).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(isValidMetricName('')).toBe(false);
  });
});
