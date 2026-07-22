import { describe, expect, it } from 'vitest';

import { getPrometheusRulesApiBasePath, getRulerApiBasePath } from './rules';

describe('getPrometheusRulesApiBasePath', () => {
  it('uses the Prometheus rules path', () => {
    expect(getPrometheusRulesApiBasePath('prometheus')).toBe('api/v1/rules');
  });

  it('uses the Loki Prometheus-compatible rules path', () => {
    expect(getPrometheusRulesApiBasePath('loki')).toBe('api/prom/rules');
  });
});

describe('getRulerApiBasePath', () => {
  it('uses the configuration path for Prometheus-compatible implementations', () => {
    expect(getRulerApiBasePath('prometheus')).toBe('config/v1/rules');
    expect(getRulerApiBasePath('mimir')).toBe('config/v1/rules');
    expect(getRulerApiBasePath('cortex')).toBe('config/v1/rules');
  });

  it('uses the Loki Ruler path', () => {
    expect(getRulerApiBasePath('loki')).toBe('api/prom/rules');
  });
});
