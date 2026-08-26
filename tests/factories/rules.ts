import {
  DataSourceRuleIdentifier,
  PrometheusRuleIdentifier,
  CloudRuleIdentifier,
  stringifyIdentifier,
} from '@grafana/external-rules/identifiers';
import type {
  PromRuleDTO,
  PromAlertingRuleDTO,
  PromRecordingRuleDTO,
  PromRuleGroupDTO,
  RulerRuleGroupDTO,
  RulerAlertingRuleDTO,
  RulerRecordingRuleDTO,
} from '@grafana/external-rules/vanilla';
import { hashRule, hashRulerRule } from '@grafana/external-rules/hashing';

/**
 * Constants for test data source and rules
 * These match the provisioned data source and Prometheus rules
 */
export const TEST_DATASOURCE_UID = 'test-prometheus';
export const TEST_NAMESPACE = '/etc/prometheus/rules/test-rules.yml';
export const TEST_MIMIR_DATASOURCE_UID = 'test-mimir';
export const TEST_LOKI_DATASOURCE_UID = 'test-loki';

/**
 * Helper class for building test data for rule tests
 * This class helps create identifiers for rules that exist in the test Prometheus instance
 */
export class RuleBuilder {
  /**
   * Create a Prometheus rule identifier
   */
  static createPrometheusRuleIdentifier(
    uid: string,
    namespace = 'test-namespace',
    groupName = 'test-group',
    ruleName = 'test-rule'
  ): PrometheusRuleIdentifier {
    // Create a minimal rule to hash
    const rule: PromAlertingRuleDTO = {
      type: 'alerting',
      name: ruleName,
      query: 'up == 0',
      state: 'firing',
      health: 'ok',
    };

    const ruleHash = hashRule(rule);

    return {
      type: 'prometheus',
      uid,
      namespace,
      groupName,
      ruleName,
      ruleHash,
    };
  }

  /**
   * Create a Cloud/Ruler rule identifier
   */
  static createCloudRuleIdentifier(
    uid: string,
    namespace = 'test-namespace',
    groupName = 'test-group',
    ruleName = 'test-rule'
  ): CloudRuleIdentifier {
    // Create a minimal ruler rule to hash
    const rule: RulerAlertingRuleDTO = {
      alert: ruleName,
      expr: 'up == 0',
    };

    const rulerRuleHash = hashRulerRule(rule);

    return {
      type: 'cloud',
      uid,
      namespace,
      groupName,
      ruleName,
      rulerRuleHash,
    };
  }

  /**
   * Identifier for a rule the test seeded itself.
   *
   * The rule object has to match what the ruler holds byte for byte -- the identifier carries a
   * hash of it, and the rule editor looks the rule up by that hash.
   */
  static identifierForRulerRule(
    uid: string,
    namespace: string,
    groupName: string,
    rule: RulerAlertingRuleDTO | RulerRecordingRuleDTO
  ): CloudRuleIdentifier {
    return {
      type: 'cloud',
      uid,
      namespace,
      groupName,
      ruleName: 'alert' in rule ? rule.alert : rule.record,
      rulerRuleHash: hashRulerRule(rule),
    };
  }

  /**
   * Create a Prometheus alerting rule
   */
  static createPromAlertingRule(overrides: Partial<PromAlertingRuleDTO> & { name: string }): PromAlertingRuleDTO {
    return {
      type: 'alerting',
      name: overrides.name,
      query: overrides.query ?? 'up == 0',
      state: overrides.state ?? 'firing',
      health: overrides.health ?? 'ok',
      labels: overrides.labels,
      annotations: overrides.annotations,
      alerts: overrides.alerts,
      duration: overrides.duration,
      evaluationTime: overrides.evaluationTime,
      lastEvaluation: overrides.lastEvaluation,
      lastError: overrides.lastError,
    };
  }

  /**
   * Create a Prometheus recording rule
   */
  static createPromRecordingRule(overrides: Partial<PromRecordingRuleDTO> & { name: string }): PromRecordingRuleDTO {
    return {
      type: 'recording',
      name: overrides.name,
      query: overrides.query ?? 'sum(up)',
      health: overrides.health ?? 'ok',
      labels: overrides.labels,
      evaluationTime: overrides.evaluationTime,
      lastEvaluation: overrides.lastEvaluation,
      lastError: overrides.lastError,
    };
  }

  /**
   * Create a Prometheus rule group
   */
  static createPromRuleGroup(
    namespace: string,
    groupName: string,
    rules: PromRuleDTO[],
    overrides?: Partial<PromRuleGroupDTO>
  ): PromRuleGroupDTO {
    return {
      name: groupName,
      file: namespace,
      rules,
      interval: overrides?.interval ?? 60,
      evaluationTime: overrides?.evaluationTime,
      lastEvaluation: overrides?.lastEvaluation,
    };
  }

  /**
   * Create a Ruler rule group
   */
  static createRulerRuleGroup(
    groupName: string,
    rules: Array<RulerAlertingRuleDTO | RulerRecordingRuleDTO>,
    interval?: string
  ): RulerRuleGroupDTO {
    return {
      name: groupName,
      interval,
      rules,
    };
  }

  /**
   * Create a Ruler alerting rule
   */
  static createRulerAlertingRule(
    ruleName: string,
    expr: string,
    overrides?: Partial<RulerAlertingRuleDTO>
  ): RulerAlertingRuleDTO {
    return {
      alert: ruleName,
      expr,
      labels: overrides?.labels,
      annotations: overrides?.annotations,
      for: overrides?.for,
      keep_firing_for: overrides?.keep_firing_for,
    };
  }

  /**
   * Create a Ruler recording rule
   */
  static createRulerRecordingRule(
    ruleName: string,
    expr: string,
    labels?: Record<string, string>
  ): RulerRecordingRuleDTO {
    return {
      record: ruleName,
      expr,
      labels,
    };
  }

  /**
   * Get the URL for a rule details page
   */
  static getRuleUrl(identifier: DataSourceRuleIdentifier): string {
    const encodedId = encodeURIComponent(stringifyIdentifier(identifier));
    return `/rules/${encodedId}`;
  }

  /**
   * Create identifier for the HighErrorRate test rule
   * This rule exists in test-data/prometheus/rules/test-rules.yml
   */
  static createHighErrorRateIdentifier(): PrometheusRuleIdentifier {
    const rule: PromAlertingRuleDTO = {
      type: 'alerting',
      name: 'HighErrorRate',
      query: 'vector(1) > 0',
      state: 'firing',
      health: 'ok',
      labels: {
        severity: 'critical',
        team: 'platform',
      },
      annotations: {
        summary: 'High error rate detected',
        description: 'Error rate is above threshold',
      },
    };

    return {
      type: 'prometheus',
      uid: TEST_DATASOURCE_UID,
      namespace: TEST_NAMESPACE,
      groupName: 'test-group',
      ruleName: 'HighErrorRate',
      ruleHash: hashRule(rule),
    };
  }

  /**
   * Create identifier for the recording rule test
   */
  static createRecordingRuleIdentifier(): PrometheusRuleIdentifier {
    const rule: PromRecordingRuleDTO = {
      type: 'recording',
      name: 'test:request_rate:sum',
      query: 'sum(rate(prometheus_http_requests_total[5m]))',
      health: 'ok',
      labels: {
        environment: 'test',
      },
    };

    return {
      type: 'prometheus',
      uid: TEST_DATASOURCE_UID,
      namespace: TEST_NAMESPACE,
      groupName: 'test-group',
      ruleName: 'test:request_rate:sum',
      ruleHash: hashRule(rule),
    };
  }

  /**
   * Create identifier for the RuleToDelete test rule
   */
  static createRuleToDeleteIdentifier(): PrometheusRuleIdentifier {
    const rule: PromAlertingRuleDTO = {
      type: 'alerting',
      name: 'RuleToDelete',
      query: 'up == 0',
      state: 'inactive',
      health: 'ok',
      labels: {
        severity: 'warning',
      },
      annotations: {
        summary: 'Service is down',
      },
    };

    return {
      type: 'prometheus',
      uid: TEST_DATASOURCE_UID,
      namespace: TEST_NAMESPACE,
      groupName: 'another-group',
      ruleName: 'RuleToDelete',
      ruleHash: hashRule(rule),
    };
  }

  /**
   * Create identifier for the InactiveRule test
   */
  static createInactiveRuleIdentifier(): PrometheusRuleIdentifier {
    const rule: PromAlertingRuleDTO = {
      type: 'alerting',
      name: 'InactiveRule',
      query: 'vector(0) > 1',
      state: 'inactive',
      health: 'ok',
      labels: {
        severity: 'info',
      },
    };

    return {
      type: 'prometheus',
      uid: TEST_DATASOURCE_UID,
      namespace: TEST_NAMESPACE,
      groupName: 'state-test-group',
      ruleName: 'InactiveRule',
      ruleHash: hashRule(rule),
    };
  }

  /**
   * Create a Mimir rule identifier with custom rule expression
   */
  static createMimirRuleIdentifier(
    namespace: string,
    groupName: string,
    ruleName: string,
    ruleExpr: string
  ): CloudRuleIdentifier {
    const rule: RulerAlertingRuleDTO = {
      alert: ruleName,
      expr: ruleExpr,
    };

    const rulerRuleHash = hashRulerRule(rule);

    return {
      type: 'cloud',
      uid: TEST_MIMIR_DATASOURCE_UID,
      namespace,
      groupName,
      ruleName,
      rulerRuleHash,
    };
  }

  /**
   * Create identifier for the pre-seeded Loki TestEditRule.
   */
  static createLokiTestEditRuleIdentifier(
    uid = TEST_LOKI_DATASOURCE_UID,
    namespace = 'e2e-test-namespace',
    groupName = 'e2e-test-group'
  ): CloudRuleIdentifier {
    const rule: RulerAlertingRuleDTO = {
      alert: 'TestEditRule',
      expr: 'sum(count_over_time({job="grafana"}[5m])) > 1000',
      for: '5m',
      labels: {
        severity: 'warning',
        team: 'platform',
      },
      annotations: {
        summary: 'Original summary for testing edit',
        description: 'This rule is used for testing the edit functionality',
      },
    };

    return {
      type: 'cloud',
      uid,
      namespace,
      groupName,
      ruleName: 'TestEditRule',
      rulerRuleHash: hashRulerRule(rule),
    };
  }

  /**
   * Get the URL for creating a new rule
   */
  static getRuleEditorUrl(type: 'alerting' | 'recording'): string {
    return `/rules/new?type=${type}`;
  }

  /**
   * Get the URL for editing a rule
   */
  static getRuleEditUrl(identifier: CloudRuleIdentifier): string {
    const encodedId = encodeURIComponent(stringifyIdentifier(identifier));
    return `/rules/${encodedId}/edit`;
  }

  /**
   * Get the URL for cloning a rule
   */
  static getRuleCloneUrl(identifier: CloudRuleIdentifier): string {
    const encodedId = encodeURIComponent(stringifyIdentifier(identifier));
    return `/rules/new?copyFrom=${encodedId}`;
  }

  /**
   * Create identifier for the TestEditRule (pre-provisioned in Mimir)
   * This rule exists in test-data/mimir/rules/e2e-test-namespace/e2e-test-group.yaml
   *
   * IMPORTANT: The hash must match the actual rule definition including labels and annotations
   */
  static createTestEditRuleIdentifier(uid = TEST_MIMIR_DATASOURCE_UID): CloudRuleIdentifier {
    // Must match test-data/mimir/rules/e2e-test-namespace/e2e-test-group.yaml exactly
    const rule: RulerAlertingRuleDTO = {
      alert: 'TestEditRule',
      expr: 'up == 0',
      for: '5m',
      labels: {
        severity: 'warning',
        team: 'platform',
      },
      annotations: {
        summary: 'Original summary for testing edit',
        description: 'This rule is used for testing the edit functionality',
      },
    };

    return {
      type: 'cloud',
      uid,
      namespace: 'e2e-test-namespace',
      groupName: 'e2e-test-group',
      ruleName: 'TestEditRule',
      rulerRuleHash: hashRulerRule(rule),
    };
  }

  /**
   * Create identifier for the TestCloneRule (pre-provisioned in Mimir)
   * This rule exists in test-data/mimir/rules/e2e-test-namespace/e2e-test-group.yaml
   */
  static createTestCloneRuleIdentifier(uid = TEST_MIMIR_DATASOURCE_UID): CloudRuleIdentifier {
    // Must match test-data/mimir/rules/e2e-test-namespace/e2e-test-group.yaml exactly
    const rule: RulerAlertingRuleDTO = {
      alert: 'TestCloneRule',
      expr: 'vector(1) > 0',
      for: '2m',
      labels: {
        severity: 'info',
      },
      annotations: {
        summary: 'Rule to be cloned',
      },
    };

    return {
      type: 'cloud',
      uid,
      namespace: 'e2e-test-namespace',
      groupName: 'e2e-test-group',
      ruleName: 'TestCloneRule',
      rulerRuleHash: hashRulerRule(rule),
    };
  }

  /**
   * Create identifier for the test recording rule (pre-provisioned in Mimir)
   */
  static createTestRecordingRuleIdentifier(uid = TEST_MIMIR_DATASOURCE_UID): CloudRuleIdentifier {
    // Must match test-data/mimir/rules/e2e-test-namespace/e2e-test-group.yaml exactly
    const rule: RulerRecordingRuleDTO = {
      record: 'test:recording:rule',
      expr: 'sum(up)',
      labels: {
        environment: 'test',
      },
    };

    return {
      type: 'cloud',
      uid,
      namespace: 'e2e-test-namespace',
      groupName: 'e2e-test-group',
      ruleName: 'test:recording:rule',
      rulerRuleHash: hashRulerRule(rule),
    };
  }
}
