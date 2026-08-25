import { test as base } from '@grafana/plugin-e2e';
import { randomUUID } from 'node:crypto';
import pluginJson from '../../src/plugin.json';
import { createLokiRulerDataSource, createMimirRulerDataSource, deleteGrafanaDataSource } from '../api/grafana';
import { deleteLokiRuleGroup, postLokiRuleGroup, waitForLokiRules } from '../api/loki';
import { deleteMimirRuleGroup, postMimirRuleGroup } from '../api/mimir';
import { RuleDetailsPage } from '../pages/RuleDetailsPage';
import { RuleEditorPage } from '../pages/RuleEditorPage';
import { RulesListPage } from '../pages/RulesListPage';
import { GroupDetailsPage } from '../pages/GroupDetailsPage';
import { GroupEditPage } from '../pages/GroupEditPage';

const MIMIR_TEST_NAMESPACE = 'e2e-test-namespace';
const MIMIR_TEST_GROUP = 'e2e-test-group';
const MIMIR_BASELINE_RULES = `name: ${MIMIR_TEST_GROUP}
interval: 1m
rules:
  - alert: TestEditRule
    expr: up == 0
    for: 5m
    labels:
      severity: warning
      team: platform
    annotations:
      summary: Original summary for testing edit
      description: This rule is used for testing the edit functionality
  - alert: TestCloneRule
    expr: vector(1) > 0
    for: 2m
    labels:
      severity: info
    annotations:
      summary: Rule to be cloned
  - record: test:recording:rule
    expr: sum(up)
    labels:
      environment: test
`;

function getLokiBaselineRules(groupName: string): string {
  return `name: ${groupName}
interval: 1m
rules:
  - alert: TestEditRule
    expr: sum(count_over_time({job="grafana"}[5m])) > 1000
    for: 5m
    labels:
      severity: warning
      team: platform
    annotations:
      summary: Original summary for testing edit
      description: This rule is used for testing the edit functionality
  - alert: TestCloneRule
    expr: sum(count_over_time({job="grafana"}[5m])) > 0
    for: 2m
    labels:
      severity: info
    annotations:
      summary: Rule to be cloned
  - alert: TestAlwaysPending
    expr: sum(count_over_time({job="grafana"}[5m])) >= 0
    for: 1h
    labels:
      severity: critical
    annotations:
      summary: Rule with long for duration to stay in pending state
`;
}

type MimirRulerFixture = {
  uid: string;
  name: string;
  tenantId: string;
  /** Namespace of the baseline group seeded in this fixture's isolated tenant. */
  namespace: string;
  /** Name of the baseline group seeded in this fixture's isolated tenant. */
  groupName: string;
};

type LokiRulerFixture = {
  uid: string;
  name: string;
  namespace: string;
  groupName: string;
};

type RulerTestFixture = {
  groupDetailsPage: GroupDetailsPage;
  groupEditPage: GroupEditPage;
  ruleDetailsPage: RuleDetailsPage;
  ruleEditorPage: RuleEditorPage;
  rulesListPage: RulesListPage;
  /**
   * Reserve a unique Mimir rule group name for the duration of a test.
   * Returns `${baseName}_${uuid}` and registers the group for automatic
   * deletion in the fixture's teardown — safe under fullyParallel workers.
   */
  mimirGroup: (baseName: string) => string;
  /** A dedicated Loki datasource and pre-seeded rule group, isolated for one test. */
  lokiRuler: LokiRulerFixture;
  /** A dedicated Mimir Ruler tenant and Grafana datasource, isolated for one test. */
  mimirRuler: MimirRulerFixture;
  /**
   * A Mimir datasource with "Manage alerts via Alerting UI" switched off, and no rules seeded.
   * The alerting UI is meant to leave it alone entirely.
   */
  unmanagedRuler: { uid: string; name: string };
};

export const test = base.extend<RulerTestFixture>({
  groupDetailsPage: async ({ page }, use) => {
    await use(new GroupDetailsPage(page, pluginJson.id));
  },
  groupEditPage: async ({ page }, use) => {
    await use(new GroupEditPage(page, pluginJson.id));
  },
  ruleDetailsPage: async ({ page }, use) => {
    const ruleDetailsPage = new RuleDetailsPage(page);
    await use(ruleDetailsPage);
  },
  ruleEditorPage: async ({ page }, use) => {
    const ruleEditorPage = new RuleEditorPage(page);
    await use(ruleEditorPage);
  },
  rulesListPage: async ({ page }, use) => {
    const rulesListPage = new RulesListPage(page, pluginJson.id);
    await use(rulesListPage);
  },
  mimirGroup: async ({ mimirRuler }, use) => {
    const created: string[] = [];
    await use((baseName) => {
      const name = `${baseName}_${randomUUID().replaceAll('-', '')}`;
      created.push(name);
      return name;
    });
    await Promise.all(created.map((g) => deleteMimirRuleGroup(mimirRuler.tenantId, MIMIR_TEST_NAMESPACE, g)));
  },
  lokiRuler: async ({}, use) => {
    const suffix = randomUUID().replaceAll('-', '');
    // Grafana datasource UIDs are limited to 40 characters.
    const uid = `e2el-${suffix}`;
    const name = `E2E Loki Ruler ${suffix}`;
    const namespace = `e2e-loki-${suffix}`;
    const groupName = `e2e-loki-group-${suffix}`;
    await createLokiRulerDataSource({ uid, name });

    try {
      await postLokiRuleGroup(namespace, getLokiBaselineRules(groupName));
      await waitForLokiRules(namespace, groupName, ['TestEditRule', 'TestCloneRule', 'TestAlwaysPending']);
      await use({ uid, name, namespace, groupName });
    } finally {
      try {
        await deleteLokiRuleGroup(namespace, groupName);
      } finally {
        await deleteGrafanaDataSource(uid);
      }
    }
  },
  unmanagedRuler: async ({}, use) => {
    const suffix = randomUUID().replaceAll('-', '');
    const uid = `e2e-u-${suffix}`;
    const name = `E2E Unmanaged Mimir ${suffix}`;
    await createMimirRulerDataSource({ uid, name, tenantId: uid, manageAlerts: false });

    try {
      await use({ uid, name });
    } finally {
      await deleteGrafanaDataSource(uid);
    }
  },
  mimirRuler: async ({}, use) => {
    const suffix = randomUUID().replaceAll('-', '');
    const uid = `e2e-r-${suffix}`;
    const tenantId = uid;
    const name = `E2E Mimir Ruler ${suffix}`;
    await createMimirRulerDataSource({ uid, name, tenantId });

    try {
      // Seed the same baseline namespace and group in every isolated tenant.
      await postMimirRuleGroup(tenantId, MIMIR_TEST_NAMESPACE, MIMIR_BASELINE_RULES);
      await use({ uid, name, tenantId, namespace: MIMIR_TEST_NAMESPACE, groupName: MIMIR_TEST_GROUP });
    } finally {
      try {
        await deleteMimirRuleGroup(tenantId, MIMIR_TEST_NAMESPACE, MIMIR_TEST_GROUP);
      } finally {
        await deleteGrafanaDataSource(uid);
      }
    }
  },
});

export { expect } from '@grafana/plugin-e2e';
