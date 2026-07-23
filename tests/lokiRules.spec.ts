import { test, expect } from './fixtures/ruler';
import { waitForLokiRules } from './api/loki';
import { RuleBuilder } from './factories/rules';

const LOKI_RULE_NAMES = ['TestEditRule', 'TestCloneRule', 'TestAlwaysPending'];
const INITIAL_EXPRESSION = 'sum(count_over_time({job="grafana"}[5m])) > 1000';

/**
 * E2E coverage for rules loaded from the provisioned Loki datasource.
 *
 * Loki exposes evaluated rule state as JSON at /prometheus/api/v1/rules and
 * Ruler configuration as YAML at /api/prom/rules. These tests cover both
 * endpoints through the rule list, details, and edit workflows.
 */
test.describe('Loki Rules - E2E', () => {
  test('lists only the rules from an isolated Loki datasource and namespace filter', async ({
    lokiRuler,
    rulesListPage,
    page,
  }) => {
    test.slow();
    await page.goto(
      `/a/${rulesListPage.pluginId}/rules?search=${encodeURIComponent(
        `datasource:"${lokiRuler.name}" namespace:${lokiRuler.namespace}`
      )}`
    );
    await rulesListPage.waitForLoad();

    await expect(rulesListPage.ruleRows).toHaveCount(LOKI_RULE_NAMES.length, { timeout: 15000 });
    await expect(page.getByRole('button', { name: `Remove ${lokiRuler.name}` })).toBeVisible();
    expect(await rulesListPage.getSearchQueryFromUrl()).toBe(
      `datasource:"${lokiRuler.name}" namespace:${lokiRuler.namespace}`
    );
    for (const ruleName of LOKI_RULE_NAMES) {
      await expect(rulesListPage.getRuleRows(ruleName)).toHaveCount(1);
    }
  });

  test('shows a Loki rule details page', async ({ lokiRuler, ruleDetailsPage, page }) => {
    test.slow();
    const identifier = RuleBuilder.createLokiTestEditRuleIdentifier(
      lokiRuler.uid,
      lokiRuler.namespace,
      lokiRuler.groupName
    );

    await ruleDetailsPage.goto(identifier);
    await ruleDetailsPage.waitForLoad('TestEditRule');

    expect(await ruleDetailsPage.hasError()).toBe(false);
    expect(await ruleDetailsPage.isNotFound()).toBe(false);
    await expect(ruleDetailsPage.editButton).toBeVisible();
    expect(await ruleDetailsPage.getRuleName()).toBe('TestEditRule');
    expect(await ruleDetailsPage.getQueryExpression()).toBe(INITIAL_EXPRESSION);
    await expect(page.getByRole('listitem', { name: 'severity: warning' })).toBeVisible();
  });

  test('creates a Loki rule and saves it correctly', async ({ lokiRuler, ruleDetailsPage, ruleEditorPage, page }) => {
    test.slow();
    const createdRuleName = `LokiCreate_${Date.now()}`;

    await ruleEditorPage.gotoNew('alerting');
    await ruleEditorPage.waitForLoad();
    await ruleEditorPage.fillRuleName(createdRuleName);
    await ruleEditorPage.selectDataSource(lokiRuler.name);
    await ruleEditorPage.fillExpression(INITIAL_EXPRESSION);
    await ruleEditorPage.selectNamespace(lokiRuler.namespace);
    await ruleEditorPage.selectGroup(lokiRuler.groupName);
    await ruleEditorPage.clickSave();

    await waitForLokiRules(lokiRuler.namespace, lokiRuler.groupName, [createdRuleName]);
    await page.reload();
    await ruleDetailsPage.waitForLoad(createdRuleName);
    await expect(ruleDetailsPage.editButton).toBeVisible();
    expect(await ruleDetailsPage.getRuleName()).toBe(createdRuleName);
    expect(await ruleDetailsPage.getQueryExpression()).toBe(INITIAL_EXPRESSION);
  });

  test('edits an existing Loki rule and persists the update', async ({ lokiRuler, ruleDetailsPage, ruleEditorPage, page }) => {
    test.slow();
    const updatedRuleName = `TestEditRuleUpdated_${Date.now()}`;
    const updatedExpression = 'sum(count_over_time({job="grafana"}[5m])) > 0';
    const identifier = RuleBuilder.createLokiTestEditRuleIdentifier(
      lokiRuler.uid,
      lokiRuler.namespace,
      lokiRuler.groupName
    );

    await ruleEditorPage.gotoEdit(identifier);
    await ruleEditorPage.waitForLoad(/Edit/);

    await expect(ruleEditorPage.ruleNameInput).toHaveValue('TestEditRule');
    expect(await ruleEditorPage.getExpression()).toBe(INITIAL_EXPRESSION);
    await expect(ruleEditorPage.pendingPeriodInput).toHaveValue('5');

    await ruleEditorPage.fillRuleName(updatedRuleName);
    await ruleEditorPage.fillExpression(updatedExpression);
    await ruleEditorPage.clickSave();

    await waitForLokiRules(lokiRuler.namespace, lokiRuler.groupName, [updatedRuleName]);
    await page.reload();
    await ruleDetailsPage.waitForLoad();
    await expect(ruleDetailsPage.editButton).toBeVisible();
    await ruleDetailsPage.waitForLoad(updatedRuleName);
    expect(await ruleDetailsPage.getRuleName()).toBe(updatedRuleName);
    expect(await ruleDetailsPage.getQueryExpression()).toBe(updatedExpression);
  });
});
