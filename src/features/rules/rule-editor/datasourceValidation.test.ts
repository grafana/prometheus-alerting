import { isSupportedExternalRulesSourceType } from './datasourceValidation';

describe('isSupportedExternalRulesSourceType', () => {
  it.each(['prometheus', 'loki', 'mimir', 'cortex'])('returns true for %s', (type) => {
    expect(isSupportedExternalRulesSourceType(type)).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isSupportedExternalRulesSourceType('Prometheus')).toBe(true);
    expect(isSupportedExternalRulesSourceType('MIMIR')).toBe(true);
  });

  it('returns false for unsupported types', () => {
    expect(isSupportedExternalRulesSourceType('elasticsearch')).toBe(false);
    expect(isSupportedExternalRulesSourceType('')).toBe(false);
  });
});
