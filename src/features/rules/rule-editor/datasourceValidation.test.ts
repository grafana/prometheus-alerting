import { isSupportedExternalRulesSourceType } from './datasourceValidation';

describe('isSupportedExternalRulesSourceType', () => {
  it.each(['prometheus', 'loki'])('returns true for %s', (type) => {
    expect(isSupportedExternalRulesSourceType(type)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isSupportedExternalRulesSourceType('Prometheus')).toBe(true);
    expect(isSupportedExternalRulesSourceType('LOKI')).toBe(true);
  });

  // `type` is a Grafana plugin type. Mimir and Cortex register as `prometheus`, so these values
  // never reach this function — feature discovery tells the three apart at runtime instead.
  it.each(['mimir', 'cortex'])('returns false for %s, which is an application and not a plugin type', (type) => {
    expect(isSupportedExternalRulesSourceType(type)).toBe(false);
  });

  it('returns false for unsupported types', () => {
    expect(isSupportedExternalRulesSourceType('elasticsearch')).toBe(false);
    expect(isSupportedExternalRulesSourceType('')).toBe(false);
  });
});
