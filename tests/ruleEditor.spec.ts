import { test, expect } from './fixtures';
import { RuleBuilder } from './helpers/rules.helpers';

/**
 * E2E tests for the RuleEditor page
 * Tests rule creation, editing, cloning, and validation
 *
 * Edit/Clone tests use pre-provisioned rules from test-data/mimir/rules/
 * Creation tests create new rules dynamically (no cleanup needed)
 */
test.describe('RuleEditor Page - E2E', () => {
  // Helper to get base URL from page
  const getBaseUrl = (url: string): string => {
    return url.match(/^https?:\/\/[^/]+/)?.[0] || 'http://localhost:3000';
  };

  test.describe('New Rule Creation', () => {
    test('should create a new alerting rule successfully', async ({ ruleEditorPage, page }) => {
      // Navigate to new alerting rule page
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      // Verify page title
      expect(await ruleEditorPage.getPageTitle()).toBe('New alert rule');

      // Fill all form sections
      await ruleEditorPage.fillRuleName('HighCPUUsage');
      await ruleEditorPage.selectDataSource('Test Mimir');
      await ruleEditorPage.fillExpression('up == 0');
      await ruleEditorPage.setPendingPeriod(5, 'minutes');
      await ruleEditorPage.selectNamespace('e2e-test-namespace');
      await ruleEditorPage.selectGroup('e2e-test-group');

      // Open labels modal and add labels
      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ severity: 'critical', team: 'platform' });
      await labelsModal.save();

      // Verify annotations section is visible for alerting rules
      expect(await ruleEditorPage.hasAnnotationsSection()).toBe(true);
      await ruleEditorPage.addAnnotation('summary', 'High CPU usage detected');

      // Save the rule
      await ruleEditorPage.clickSave();

      // Wait for navigation to rules list
      await page.waitForURL('**/rules', { timeout: 5000 });

      // Verify we navigated to rules list
      expect(page.url()).toContain('/rules');
      expect(page.url()).not.toContain('/new');
    });

    test('should create a new recording rule successfully', async ({ ruleEditorPage, page }) => {
      // Navigate to new recording rule page
      await ruleEditorPage.gotoNew('recording');
      await ruleEditorPage.waitForLoad();

      // Verify page title
      expect(await ruleEditorPage.getPageTitle()).toBe('New recording rule');

      // Fill form sections
      await ruleEditorPage.fillRuleName('request_rate_sum');
      await ruleEditorPage.selectDataSource('Test Mimir');
      await ruleEditorPage.fillExpression('sum(rate(http_requests_total[5m]))');
      await ruleEditorPage.selectNamespace('e2e-test-namespace');
      await ruleEditorPage.selectGroup('e2e-recording-group');

      // Open labels modal and add labels
      const labelsModal = await ruleEditorPage.openLabelsModal();
      await labelsModal.addLabels({ environment: 'test' });
      await labelsModal.save();

      // Verify annotations section is NOT visible for recording rules
      expect(await ruleEditorPage.hasAnnotationsSection()).toBe(false);

      // Save the rule
      await ruleEditorPage.clickSave();

      // Wait for navigation to rules list
      await page.waitForURL('**/rules', { timeout: 5000 });

      // Verify we navigated to rules list
      expect(page.url()).toContain('/rules');
      expect(page.url()).not.toContain('/new');
    });
  });

  test.describe('Edit Existing Rule', () => {
    test('should edit an existing rule successfully', async ({ ruleEditorPage, page }) => {
      // Use pre-provisioned rule from test-data/mimir/rules/
      const identifier = RuleBuilder.createTestEditRuleIdentifier();

      // Navigate to edit page
      await ruleEditorPage.gotoEdit(identifier);
      await ruleEditorPage.waitForLoad();

      // Verify page title contains "Edit"
      const pageTitle = await ruleEditorPage.getPageTitle();
      expect(pageTitle).toContain('Edit');

      // Verify form is pre-filled with provisioned rule data
      expect(await ruleEditorPage.getRuleName()).toBe('TestEditRule');
      expect(await ruleEditorPage.getExpression()).toBe('up == 0');

      // Modify the rule name
      await ruleEditorPage.fillRuleName('TestEditRule_Modified');

      // Save the changes
      await ruleEditorPage.clickSave();

      // Wait for navigation
      await page.waitForURL('**/rules', { timeout: 5000 });

      // Verify we navigated away from edit page
      expect(page.url()).toContain('/rules');
      expect(page.url()).not.toContain('/edit');
    });
  });

  test.describe('Clone Rule', () => {
    test('should clone an existing rule successfully', async ({ ruleEditorPage, page }) => {
      // Use pre-provisioned rule from test-data/mimir/rules/
      const identifier = RuleBuilder.createTestCloneRuleIdentifier();

      // Navigate to clone page
      await ruleEditorPage.gotoClone(identifier);
      await ruleEditorPage.waitForLoad();

      // Verify page title
      const pageTitle = await ruleEditorPage.getPageTitle();
      expect(pageTitle).toContain('Clone');

      // Verify name is modified with " (copy)" suffix
      const clonedName = await ruleEditorPage.getRuleName();
      expect(clonedName).toContain('TestCloneRule');
      expect(clonedName).toContain('copy');

      // Change the name to something unique
      await ruleEditorPage.fillRuleName('TestCloneRule_Cloned');

      // Save the cloned rule
      await ruleEditorPage.clickSave();

      // Wait for navigation
      await page.waitForURL('**/rules', { timeout: 5000 });

      // Verify we navigated to rules list
      expect(page.url()).toContain('/rules');
      expect(page.url()).not.toContain('/clone');
    });
  });

  test.describe('Data Source Selection', () => {
    test('should be able to select a data source and fill expression', async ({ ruleEditorPage, page }) => {
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      // Select data source
      await ruleEditorPage.selectDataSource('Test Mimir');

      // Fill expression
      await ruleEditorPage.fillExpression('up == 0');

      // Verify expression was filled
      const expression = await ruleEditorPage.getExpression();
      expect(expression).toBe('up == 0');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back when clicking Cancel', async ({ ruleEditorPage, page }) => {
      // First, navigate to rules list
      const baseUrl = getBaseUrl(page.url());
      await page.goto(`${baseUrl}/a/grafana-prometheusalerting-app/rules`);
      await page.waitForLoadState('networkidle');

      // Then navigate to new rule page
      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      // Fill some fields (just the name, don't need data source/expression for cancel test)
      await ruleEditorPage.fillRuleName('CancelTest');

      // Click Cancel
      await ruleEditorPage.clickCancel();

      // Wait for navigation
      await page.waitForURL('**/rules', { timeout: 5000 });

      // Verify we're back on rules list
      expect(page.url()).toContain('/rules');
      expect(page.url()).not.toContain('/new');
    });
  });

  // Cleanup: Restore pre-provisioned rules after Edit/Clone tests
  test.afterEach(async ({}, testInfo) => {
    // Only restore rules after Edit or Clone tests that modify pre-provisioned rules
    if (testInfo.title.toLowerCase().includes('edit') || testInfo.title.toLowerCase().includes('clone')) {
      try {
        // Restore original pre-provisioned rules by reloading from test-data file
        const { execSync } = require('child_process');
        execSync(
          'curl -X POST -H "Content-Type: application/yaml" ' +
            '--data-binary @test-data/mimir/rules/e2e-test-namespace/e2e-test-group.yaml ' +
            'http://localhost:9009/prometheus/config/v1/rules/e2e-test-namespace',
          { stdio: 'ignore' }
        );
      } catch (error) {
        console.error('Failed to restore pre-provisioned rules:', error);
      }
    }
  });
});
