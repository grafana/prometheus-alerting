import {
  DataSourceRuleIdentifier,
  PrometheusRuleIdentifier,
  CloudRuleIdentifier,
  stringifyIdentifier,
} from '@grafana/external-rules';
import type {
  PromRuleDTO,
  PromAlertingRuleDTO,
  PromRecordingRuleDTO,
  PromRuleGroupDTO,
  RulerRuleGroupDTO,
  RulerAlertingRuleDTO,
  RulerRecordingRuleDTO,
  PromAlertingRuleState,
} from '@grafana/external-rules/vanilla';
import { hashRule, hashRulerRule } from '@grafana/external-rules/hashing';

/**
 * Constants for test data source and rules
 * These match the provisioned data source and Prometheus rules
 */
export const TEST_DATASOURCE_UID = 'test-prometheus';
export const TEST_NAMESPACE = '/etc/prometheus/rules/test-rules.yml';

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
}
