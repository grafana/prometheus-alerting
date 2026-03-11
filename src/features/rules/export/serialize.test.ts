import { serializeRule, generateExportFilename } from './serialize';
import type { RulerRuleDTO } from '@grafana/external-rules/vanilla';

const alertingRule: RulerRuleDTO = {
  alert: 'HighCPU',
  expr: 'cpu_usage > 0.9',
  for: '5m',
  labels: { severity: 'warning' },
  annotations: { summary: 'CPU high' },
};

describe('serializeRule', () => {
  it('serializes to JSON with 2-space indent', () => {
    const result = serializeRule(alertingRule, 'json');
    expect(result).toBe(JSON.stringify(alertingRule, null, 2));
  });

  it('serializes to YAML and contains the rule name', () => {
    const result = serializeRule(alertingRule, 'yaml');
    expect(result).toContain('HighCPU');
    expect(result).toContain('cpu_usage');
  });

  it('throws for unsupported format', () => {
    expect(() => serializeRule(alertingRule, 'xml' as 'json')).toThrow('Unsupported export format: xml');
  });
});

describe('generateExportFilename', () => {
  it('lowercases the rule name', () => {
    const filename = generateExportFilename('HighCPU');
    expect(filename).toMatch(/^highcpu-\d+$/);
  });

  it('replaces spaces and special chars with underscores', () => {
    const filename = generateExportFilename('My Rule! #1');
    expect(filename).toMatch(/^my_rule_1-\d+$/);
  });

  it('collapses consecutive underscores', () => {
    // Spaces and special chars become underscores; consecutive ones are collapsed.
    // Hyphens are whitelisted and stay as-is, so use a multi-space input to trigger collapsing.
    const filename = generateExportFilename('rule  name');
    expect(filename).not.toContain('__');
    expect(filename).toMatch(/^rule_name-\d+$/);
  });

  it('strips leading and trailing underscores', () => {
    const filename = generateExportFilename('!leading');
    expect(filename).not.toMatch(/^_/);
  });

  it('appends a numeric timestamp', () => {
    const filename = generateExportFilename('my-rule');
    const parts = filename.split('-');
    const timestamp = parts[parts.length - 1];
    expect(Number(timestamp)).toBeGreaterThan(0);
  });
});
