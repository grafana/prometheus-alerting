/**
 * Mock rule group data for tests.
 * Structure matches RulerRulesConfigDTO from @grafana/external-rules.
 */

import { RulerRuleGroupDTO } from '@grafana/external-rules/vanilla';

/**
 * A simple alerting rule for testing
 */
export const mockAlertingRule = {
  alert: 'HighErrorRate',
  expr: 'rate(http_requests_total{status="500"}[5m]) > 0.1',
  for: '5m',
  labels: {
    severity: 'critical',
  },
  annotations: {
    summary: 'High error rate detected',
    description: 'Error rate is above threshold',
  },
};

/**
 * A simple recording rule for testing
 */
export const mockRecordingRule = {
  record: 'job:http_requests_total:rate5m',
  expr: 'sum(rate(http_requests_total[5m])) by (job)',
  labels: {
    aggregation: '5m',
  },
};

/**
 * A mock rule group with both alerting and recording rules
 */
export const mockRuleGroup: RulerRuleGroupDTO = {
  name: 'test-group',
  interval: '1m',
  rules: [mockAlertingRule, mockRecordingRule],
};

/**
 * Another mock rule group for testing multiple groups
 */
export const mockRuleGroup2: RulerRuleGroupDTO = {
  name: 'another-group',
  interval: '5m',
  rules: [
    {
      alert: 'LowDiskSpace',
      expr: 'node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1',
      for: '10m',
      labels: { severity: 'warning' },
      annotations: { summary: 'Low disk space' },
    },
  ],
};

/**
 * Mock namespaces structure (maps namespace name to array of groups)
 * This is the format returned by GET through the datasource proxy Ruler API.
 */
export const mockNamespaces: Record<string, RulerRuleGroupDTO[]> = {
  'test-namespace': [mockRuleGroup, mockRuleGroup2],
  'another-namespace': [
    {
      name: 'namespace-2-group',
      interval: '2m',
      rules: [mockAlertingRule],
    },
  ],
};

/**
 * Helper to create a custom rule group for specific tests
 */
export function createMockRuleGroup(overrides: Partial<RulerRuleGroupDTO> = {}): RulerRuleGroupDTO {
  return {
    name: 'custom-group',
    interval: '1m',
    rules: [],
    ...overrides,
  };
}
