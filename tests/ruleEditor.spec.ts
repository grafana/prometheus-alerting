import type { RulerAlertingRuleDTO } from '@grafana/external-rules/vanilla';

import { test, expect } from './fixtures/ruler';
import { getMimirRuleGroup, postMimirRuleGroup } from './api/mimir';
import { RuleBuilder } from './factories/rules';

/**
 * E2E tests for the RuleEditor page
 * Tests rule creation, editing, cloning, labels, annotations, and validation
 *
 * Edit/Clone tests use pre-provisioned rules from test-data/mimir/rules/
 * Creation tests create new rules dynamically (no cleanup needed)
 */
test.describe('RuleEditor Page - E2E', () => {
  // Helper to get base URL from page
  const getBaseUrl = (url: string): string => {
    return url.match(/^https?:\/\/[^/]+/)?.[0] || 'http://localhost:3000';
  };

  test.describe('Alerting Rules', () => {
    test('should create a new alerting rule successfully', async ({ ruleEditorPage, page, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad('New alert rule');

      // Fill required fields
      await ruleEditorPage.fillRuleName('HighCPUUsage');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');
      await ruleEditorPage.setPendingPeriod(5, 'minutes');
      await ruleEditorPage.selectNamespace('e2e-test-namespace');
      await ruleEditorPage.selectGroup('e2e-test-group');

      // Add labels
      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ severity: 'critical', team: 'platform' });
      await labelsModal.save();

      // Add annotation
      await ruleEditorPage.addAnnotation('summary', 'High CPU usage detected');

      // Save and verify navigation to rule details page
      await ruleEditorPage.clickSave();
      await page.waitForURL(/\/rules\/cri/, { timeout: 5000 });
    });

    test('should edit an existing alerting rule', async ({ ruleEditorPage, page, mimirRuler }) => {
      const identifier = RuleBuilder.createTestEditRuleIdentifier(mimirRuler.uid);

      await ruleEditorPage.gotoEdit(identifier);
      await ruleEditorPage.waitForLoad(/Edit/);

      await expect(ruleEditorPage.ruleNameInput).toHaveValue('TestEditRule');

      // Modify name
      await ruleEditorPage.fillRuleName('TestEditRule_Modified');

      // Edit labels
      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.editLabel('severity', 'critical');
      await labelsModal.save();

      await ruleEditorPage.clickSave();
      await page.waitForURL(/\/rules\/cri/, { timeout: 5000 });
    });

    test('should clone an existing alerting rule', async ({ ruleEditorPage, page, mimirRuler }) => {
      const identifier = RuleBuilder.createTestCloneRuleIdentifier(mimirRuler.uid);

      await ruleEditorPage.gotoClone(identifier);
      await ruleEditorPage.waitForLoad(/Clone/);

      // Verify name has copy suffix. Use a web-first assertion so we retry until
      // the form has populated the cloned name, rather than reading it once.
      await expect(ruleEditorPage.ruleNameInput).toHaveValue(/copy/i);

      await ruleEditorPage.fillRuleName('TestCloneRule_Cloned');
      await ruleEditorPage.clickSave();
      await page.waitForURL(/\/rules\/cri/, { timeout: 5000 });
    });
  });

  test.describe('Recording Rules', () => {
    test('should create a new recording rule successfully', async ({
      ruleEditorPage,
      page,
      mimirGroup,
      mimirRuler,
    }) => {
      await ruleEditorPage.gotoNew('recording');
      await ruleEditorPage.waitForLoad('New recording rule');

      // Fill required fields
      await ruleEditorPage.fillRuleName('request_rate_sum');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('sum(rate(http_requests_total[5m]))');
      await ruleEditorPage.selectNamespace('e2e-test-namespace');
      await ruleEditorPage.createGroup(mimirGroup('e2e-recording-group'));

      // Add labels
      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ environment: 'test' });
      await labelsModal.save();

      // Verify annotations section is NOT visible for recording rules
      expect(await ruleEditorPage.hasAnnotationsSection()).toBe(false);

      await ruleEditorPage.clickSave();
      await page.waitForURL(/\/rules\/cri/, { timeout: 5000 });
    });

    test('should edit an existing recording rule', async ({ ruleEditorPage, page, mimirRuler }) => {
      const identifier = RuleBuilder.createTestRecordingRuleIdentifier(mimirRuler.uid);

      await ruleEditorPage.gotoEdit(identifier);
      await ruleEditorPage.waitForLoad(/Edit/);

      await expect(ruleEditorPage.ruleNameInput).toHaveValue('test:recording:rule');

      // Modify name
      await ruleEditorPage.fillRuleName('test:recording:rule_modified');

      // Edit labels
      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.editLabel('environment', 'production');
      await labelsModal.save();

      await ruleEditorPage.clickSave();
      await page.waitForURL(/\/rules\/cri/, { timeout: 5000 });
    });

    test('should clone an existing recording rule', async ({ ruleEditorPage, page, mimirRuler }) => {
      const identifier = RuleBuilder.createTestRecordingRuleIdentifier(mimirRuler.uid);

      await ruleEditorPage.gotoClone(identifier);
      await ruleEditorPage.waitForLoad(/Clone/);

      // Verify name has copy suffix. Use a web-first assertion so we retry until
      // the form has populated the cloned name, rather than reading it once.
      await expect(ruleEditorPage.ruleNameInput).toHaveValue(/copy/i);

      await ruleEditorPage.fillRuleName('test:recording:rule_cloned');
      await ruleEditorPage.clickSave();
      await page.waitForURL(/\/rules\/cri/, { timeout: 5000 });
    });
  });

  test.describe('Labels', () => {
    test('should add labels via modal', async ({ ruleEditorPage, page, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName('TestLabels');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');

      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ severity: 'warning', team: 'backend' });

      expect(await labelsModal.getLabelCount()).toBe(2);

      await labelsModal.save();
    });

    test('should edit existing labels', async ({ ruleEditorPage, mimirRuler }) => {
      const identifier = RuleBuilder.createTestEditRuleIdentifier(mimirRuler.uid);

      await ruleEditorPage.gotoEdit(identifier);
      await ruleEditorPage.waitForLoad();

      const labelsModal = await ruleEditorPage.openLabelsModal();

      // Edit the 'severity' label value
      await labelsModal.editLabel('severity', 'critical');
      await labelsModal.save();
    });

    test('should remove a label', async ({ ruleEditorPage, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName('TestRemoveLabel');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');

      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ severity: 'warning', team: 'backend', env: 'prod' });

      expect(await labelsModal.getLabelCount()).toBe(3);

      // Remove the 'env' label
      await labelsModal.removeLabel('env');

      expect(await labelsModal.getLabelCount()).toBe(2);

      await labelsModal.save();
    });

    test('should discard label changes when canceling', async ({ ruleEditorPage, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName('TestCancelLabels');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');

      // Add labels and save
      let labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ severity: 'warning' });
      await labelsModal.save();

      // Open modal again, add more labels, then cancel
      labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ team: 'backend' });
      await labelsModal.cancel();

      // Verify the new label was discarded - only the first label should exist
      labelsModal = await ruleEditorPage.openLabelsModal();
      expect(await labelsModal.getLabelCount()).toBe(1);
      await labelsModal.cancel();
    });
  });

  test.describe('Annotations', () => {
    test('should add annotation to alerting rule', async ({ ruleEditorPage, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName('TestAnnotations');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');

      // Verify annotations section is visible for alerting rules
      expect(await ruleEditorPage.hasAnnotationsSection()).toBe(true);

      await ruleEditorPage.addAnnotation('summary', 'Test alert summary');
      expect(await ruleEditorPage.getAnnotationCount()).toBe(1);
    });

    test('should edit existing annotation', async ({ ruleEditorPage, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName('TestEditAnnotation');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');

      // Add an annotation
      await ruleEditorPage.addAnnotation('summary', 'Original summary');

      // Edit the annotation
      await ruleEditorPage.editAnnotation('summary', 'Updated summary');
    });

    test('should remove an annotation', async ({ ruleEditorPage, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName('TestRemoveAnnotation');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');

      // Add multiple annotations
      await ruleEditorPage.addAnnotation('summary', 'Test summary');
      await ruleEditorPage.addAnnotation('description', 'Test description');

      expect(await ruleEditorPage.getAnnotationCount()).toBe(2);

      // Remove first annotation
      await ruleEditorPage.removeAnnotation('summary');

      expect(await ruleEditorPage.getAnnotationCount()).toBe(1);
    });
  });

  test.describe('Validation', () => {
    test('should show error for empty rule name', async ({ ruleEditorPage, page, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      // Fill required fields except name
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.fillExpression('up == 0');
      await ruleEditorPage.selectNamespace('e2e-test-namespace');
      await ruleEditorPage.selectGroup('e2e-test-group');

      // Try to save without name
      await ruleEditorPage.clickSave();

      // Should show validation error and not navigate away
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/new');

      // Verify error message appears (form validation should prevent submission)
      const errorAlert = page.getByRole('alert').filter({ hasText: /required/i });
      const hasError = await errorAlert.isVisible().catch(() => false);
      expect(hasError).toBe(true);
    });

    test('should show error for empty expression', async ({ ruleEditorPage, page, mimirRuler }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      // Fill required fields except expression
      await ruleEditorPage.fillRuleName('TestNoExpression');
      await ruleEditorPage.selectDataSource(mimirRuler.name);
      await ruleEditorPage.selectNamespace('e2e-test-namespace');
      await ruleEditorPage.selectGroup('e2e-test-group');

      // Try to save without expression
      await ruleEditorPage.clickSave();

      // Should show validation error and not navigate away
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/new');

      // Verify error message appears
      const errorAlert = page.getByRole('alert').filter({ hasText: /required|expression/i });
      const hasError = await errorAlert.isVisible().catch(() => false);
      expect(hasError).toBe(true);
    });
  });

  test.describe('Write fidelity', () => {
    test('keeps keep_firing_for when the rule is edited', async ({ ruleEditorPage, page, mimirRuler, mimirGroup }) => {
      const groupName = mimirGroup('keep-firing-for');
      const rule: RulerAlertingRuleDTO = {
        alert: 'KeepFiringForRule',
        expr: 'up == 0',
        for: '5m',
        keep_firing_for: '10m',
      };

      await postMimirRuleGroup(
        mimirRuler.tenantId,
        mimirRuler.namespace,
        `name: ${groupName}
interval: 1m
rules:
  - alert: ${rule.alert}
    expr: ${rule.expr}
    for: ${rule.for}
    keep_firing_for: ${rule.keep_firing_for}
`
      );

      const identifier = RuleBuilder.identifierForRulerRule(mimirRuler.uid, mimirRuler.namespace, groupName, rule);
      await ruleEditorPage.gotoEdit(identifier);
      await ruleEditorPage.waitForLoad(/Edit/);

      await ruleEditorPage.fillExpression('up == 1');
      await ruleEditorPage.clickSave();
      await page.waitForURL(/\/rules\/cri/, { timeout: 5000 });

      // There is no form field for keep_firing_for, so editing anything else used to drop it --
      // and the alert then resolved as soon as the query stopped firing.
      const group = await getMimirRuleGroup(mimirRuler.tenantId, mimirRuler.namespace, groupName);
      expect(group?.rules).toHaveLength(1);
      expect(group?.rules[0]).toMatchObject({ ...rule, expr: 'up == 1' });
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back when clicking Cancel', async ({ ruleEditorPage, page }) => {
      const baseUrl = getBaseUrl(page.url());
      await page.goto(`${baseUrl}/a/grafana-prometheusalerting-app/rules`);
      await page.waitForLoadState('networkidle');

      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName('CancelTest');
      await ruleEditorPage.clickCancel();
      await page.waitForURL('**/rules', { timeout: 5000 });
    });
  });
});
