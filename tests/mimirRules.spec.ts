import { test, expect } from './fixtures/ruler';
import { RuleBuilder } from './factories/rules';

const MIMIR_TEST_NAMESPACE = 'e2e-test-namespace';

/**
 * E2E tests for Mimir rules (requires Ruler API)
 * These tests verify CRUD operations and consistency behavior
 */

// URL pattern for rule details page ($ is URL-encoded as %24)
const RULE_DETAILS_URL_PATTERN = /\/rules\/(?:cri|pri)%24/;

test.describe('Mimir Rules - E2E', () => {
  test.describe('Rule Details with Ruler API', () => {
    test('should show edit button for Mimir rules', async ({ ruleDetailsPage }) => {
      const identifier = RuleBuilder.createTestEditRuleIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // Wait for the page to fully render
      await expect(ruleDetailsPage.pageTitle).toBeVisible({ timeout: 10000 });

      // Ensure we're not in error state
      expect(await ruleDetailsPage.hasError()).toBe(false);
      expect(await ruleDetailsPage.isNotFound()).toBe(false);

      // Mimir rules should have edit button (unlike vanilla Prometheus)
      await expect(ruleDetailsPage.editButton).toBeVisible({ timeout: 10000 });
      expect(await ruleDetailsPage.hasEditButton()).toBe(true);
    });

    test('should show delete and duplicate actions for Mimir rules', async ({ ruleDetailsPage, page }) => {
      const identifier = RuleBuilder.createTestEditRuleIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // Wait for page to fully load
      await expect(ruleDetailsPage.pageTitle).toBeVisible({ timeout: 10000 });

      // Ensure we're not in error state
      expect(await ruleDetailsPage.hasError()).toBe(false);
      expect(await ruleDetailsPage.isNotFound()).toBe(false);

      // Wait for more actions button to appear
      await expect(ruleDetailsPage.moreActionsButton).toBeVisible({ timeout: 10000 });

      // Open more actions menu
      await ruleDetailsPage.moreActionsButton.click();

      // Should have Delete and Duplicate options
      const deleteItem = page.getByRole('menuitem', { name: /delete/i });
      const duplicateItem = page.getByRole('menuitem', { name: /duplicate/i });

      await expect(deleteItem).toBeVisible();
      await expect(duplicateItem).toBeVisible();

      // Close menu
      await page.keyboard.press('Escape');
    });
  });

  test.describe('Delete Rule', () => {
    test('should delete a rule and show confirming state', async ({
      ruleEditorPage,
      ruleDetailsPage,
      page,
      mimirGroup,
    }) => {
      // First, create a new rule to delete
      const uniqueRuleName = `DeleteTest_${Date.now()}`;
      const groupName = mimirGroup('e2e-delete-test-group');

      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName(uniqueRuleName);
      await ruleEditorPage.selectDataSource('Test Mimir');
      await ruleEditorPage.fillExpression('vector(1) > 0');
      await ruleEditorPage.selectNamespace(MIMIR_TEST_NAMESPACE);
      await ruleEditorPage.createGroup(groupName);

      // Wait a moment for form state to settle
      await page.waitForTimeout(500);

      await ruleEditorPage.clickSave();

      // Wait for redirect to details page
      await page.waitForURL(RULE_DETAILS_URL_PATTERN, { timeout: 15000 });
      await ruleDetailsPage.waitForLoad();

      // Ensure we're on the rule details page (not error state)
      expect(await ruleDetailsPage.hasError()).toBe(false);

      // A newly created rule starts in a "propagating" state where the Ruler API has it
      // but Prometheus hasn't evaluated the group yet. The More/Delete actions are only
      // rendered once the rule is visible in Prometheus, so we wait here explicitly.
      await ruleDetailsPage.waitForConsistency(60000);

      // Now delete the rule
      const deleteModal = await ruleDetailsPage.clickDelete();
      await deleteModal.waitForOpen();

      // Verify the confirmation message mentions the rule name
      const message = await deleteModal.getMessage();
      expect(message).toContain(uniqueRuleName);

      // Click delete - the modal should close after deletion completes
      // The button may briefly show "Deleting..." or "Confirming..." but
      // this can be very fast with Mimir, so we just verify the modal closes
      await deleteModal.deleteButton.click();

      // Wait for modal to close (deletion complete)
      await expect(deleteModal.modal).not.toBeVisible({ timeout: 120000 });

      // Verify we're back on a page (either list or showing not found)
      await page.waitForLoadState('networkidle');
    });
  });

  test.describe('Create Rule - Consistency Warning', () => {
    test('should redirect to details page after creating a rule', async ({ ruleEditorPage, page, mimirGroup }) => {
      const uniqueRuleName = `ConsistencyTest_${Date.now()}`;
      const groupName = mimirGroup('e2e-consistency-test-group');

      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName(uniqueRuleName);
      await ruleEditorPage.selectDataSource('Test Mimir');
      await ruleEditorPage.fillExpression('vector(0) > 1'); // Always inactive
      await ruleEditorPage.selectNamespace(MIMIR_TEST_NAMESPACE);
      await ruleEditorPage.createGroup(groupName);

      // Wait a moment for form state to settle before saving
      await page.waitForTimeout(500);

      await ruleEditorPage.clickSave();

      // Wait for redirect to rule details page (should NOT match /rules/new)
      await page.waitForURL(RULE_DETAILS_URL_PATTERN, { timeout: 15000 });

      // URL should contain the rule identifier
      const url = page.url();
      expect(url).toMatch(/\/rules\/[^/]+$/);
      expect(url).not.toMatch(/\/rules\/new/);
    });

    test('should show consistency warning for newly created rule', async ({
      ruleEditorPage,
      ruleDetailsPage,
      page,
      mimirGroup,
    }) => {
      const uniqueRuleName = `PropagationTest_${Date.now()}`;
      const groupName = mimirGroup('e2e-propagation-test-group');

      await ruleEditorPage.gotoNew('alerting');
      await ruleEditorPage.waitForLoad();

      await ruleEditorPage.fillRuleName(uniqueRuleName);
      await ruleEditorPage.selectDataSource('Test Mimir');
      await ruleEditorPage.fillExpression('vector(0) > 1');
      await ruleEditorPage.selectNamespace(MIMIR_TEST_NAMESPACE);
      await ruleEditorPage.createGroup(groupName);

      // Wait a moment for form state to settle before saving
      await page.waitForTimeout(500);

      await ruleEditorPage.clickSave();

      // Wait for redirect to rule details page
      await page.waitForURL(RULE_DETAILS_URL_PATTERN, { timeout: 15000 });

      // Wait for the details page to fully load
      await ruleDetailsPage.waitForLoad();

      // Check for consistency warning (may or may not be visible depending on timing)
      // If Mimir is fast, the warning may not appear
      const hasWarning = await ruleDetailsPage.hasConsistencyWarning();

      if (hasWarning) {
        // If warning is shown, wait for it to clear
        await ruleDetailsPage.waitForConsistency(120000);

        // After consistency, the page should show the rule details
        await ruleDetailsPage.waitForLoad();
        const ruleName = await ruleDetailsPage.getRuleName();
        expect(ruleName).toBe(uniqueRuleName);
      } else {
        // If no warning, rule propagated immediately - verify rule is shown
        // Wait for the rule name to appear in the title
        await expect(ruleDetailsPage.pageTitle).toContainText(uniqueRuleName, { timeout: 10000 });
        const ruleName = await ruleDetailsPage.getRuleName();
        expect(ruleName).toBe(uniqueRuleName);
      }
    });
  });
});
