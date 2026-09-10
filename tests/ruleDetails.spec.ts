import { test, expect } from './fixtures/ruler';
import { RuleBuilder } from './factories/rules';

/**
 * E2E tests for the RuleDetails page
 * These tests run against a real Prometheus instance with pre-configured rules
 * See test-data/prometheus/rules/test-rules.yml for the test data
 */
test.describe('RuleDetails Page - E2E', () => {
  test.describe('Alerting Rules', () => {
    test('should display firing alerting rule details', async ({ ruleDetailsPage, page }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto(identifier);
      // Pass the rule name so the load wait verifies the rule's own H1 has
      // rendered (not the transient "Rules" breadcrumb heading).
      await ruleDetailsPage.waitForLoad('HighErrorRate');

      // Verify firing state
      const state = await ruleDetailsPage.getState();
      expect(state).toBe('Firing');

      // Verify labels are displayed
      const labels = await ruleDetailsPage.getLabels();
      expect(labels).toMatchObject({
        severity: 'critical',
        team: 'platform',
      });

      // Verify Query tab shows the expression
      await expect(page.getByText('vector(1) > 0')).toBeVisible();

      // Verify no Edit button (vanilla Prometheus has no Ruler API)
      expect(await ruleDetailsPage.hasEditButton()).toBe(false);
    });

    test('should display inactive alerting rule', async ({ ruleDetailsPage }) => {
      const identifier = RuleBuilder.createInactiveRuleIdentifier();

      await ruleDetailsPage.goto(identifier);
      // Pass the rule name so the load wait verifies the rule's own H1 has
      // rendered (not the transient "Rules" breadcrumb heading).
      await ruleDetailsPage.waitForLoad('InactiveRule');

      // Verify state badge shows inactive/normal
      expect(await ruleDetailsPage.hasStateBadge()).toBe(true);
      const state = await ruleDetailsPage.getState();
      expect(state.toLowerCase()).toMatch(/inactive|normal/);
    });
  });

  test.describe('Recording Rules', () => {
    test('should display recording rule with recording badge', async ({ ruleDetailsPage }) => {
      const identifier = RuleBuilder.createRecordingRuleIdentifier();

      await ruleDetailsPage.goto(identifier);
      // Pass the rule name so the load wait verifies the rule's own H1 has
      // rendered (not the transient "Rules" breadcrumb heading).
      await ruleDetailsPage.waitForLoad('test:request_rate:sum');

      // Recording rules show a "Recording" badge
      expect(await ruleDetailsPage.hasStateBadge()).toBe(true);
      const state = await ruleDetailsPage.getState();
      expect(state).toBe('Recording');

      // Should not have instances tab (only alerting rules have instances)
      expect(await ruleDetailsPage.hasInstancesTab()).toBe(false);
    });
  });

  test.describe('Tabs Navigation', () => {
    test('should display query expression in Query tab', async ({ ruleDetailsPage, page }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // Query tab should be active by default
      await expect(ruleDetailsPage.queryTab).toHaveAttribute('aria-selected', 'true');

      // Check for query expression in the page
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('vector(1) > 0');
    });

    test('should show instances tab for alerting rules', async ({ ruleDetailsPage }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // Alerting rules should have instances tab
      expect(await ruleDetailsPage.hasInstancesTab()).toBe(true);

      // Switch to instances tab
      await ruleDetailsPage.switchToTab('instances');
      await expect(ruleDetailsPage.instancesTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should show details tab with metadata', async ({ ruleDetailsPage, page }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // Switch to details tab
      await ruleDetailsPage.switchToTab('details');
      await expect(ruleDetailsPage.detailsTab).toHaveAttribute('aria-selected', 'true');

      // Check for annotation content
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('High error rate detected');
    });
  });

  test.describe('Read-Only Mode', () => {
    test('should only show copy link action (no edit/delete)', async ({ ruleDetailsPage, page }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // No Edit button (vanilla Prometheus doesn't support editing)
      expect(await ruleDetailsPage.hasEditButton()).toBe(false);

      // Open more actions menu
      await ruleDetailsPage.moreActionsButton.click();

      // Should have Copy Link
      const copyLinkItem = page.getByRole('menuitem', { name: /copy link/i });
      await expect(copyLinkItem).toBeVisible();

      // Should NOT have Delete or Duplicate (requires Ruler API)
      const deleteItem = page.getByRole('menuitem', { name: /delete/i });
      const duplicateItem = page.getByRole('menuitem', { name: /duplicate/i });

      await expect(deleteItem).not.toBeVisible();
      await expect(duplicateItem).not.toBeVisible();
    });
  });

  test.describe('Labels and Metadata', () => {
    test('should display rule labels', async ({ ruleDetailsPage }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // Verify labels are accessible via POM
      const labels = await ruleDetailsPage.getLabels();
      expect(labels).toMatchObject({
        severity: 'critical',
        team: 'platform',
      });
    });
  });

  test.describe('Unresolvable Rules', () => {
    test('should show not found for a malformed rule identifier in the URL', async ({ ruleDetailsPage }) => {
      await ruleDetailsPage.gotoRawIdentifier('totally-bogus-identifier');
      await ruleDetailsPage.waitForLoad(/rule not found/i);

      expect(await ruleDetailsPage.isNotFound()).toBe(true);
      await expect(ruleDetailsPage.backToRulesLink).toBeVisible();
    });

    test('should show not found when the identifier is well-formed but no rule matches', async ({
      ruleDetailsPage,
    }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto({ ...identifier, ruleName: 'ThisRuleDoesNotExist' });
      await ruleDetailsPage.waitForLoad(/rule not found/i);

      expect(await ruleDetailsPage.isNotFound()).toBe(true);
      await expect(ruleDetailsPage.backToRulesLink).toBeVisible();
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should display correct breadcrumb hierarchy', async ({ ruleDetailsPage, page }) => {
      const identifier = RuleBuilder.createHighErrorRateIdentifier();

      await ruleDetailsPage.goto(identifier);
      await ruleDetailsPage.waitForLoad();

      // Check breadcrumb elements are visible (they have data-testid attributes)
      // The breadcrumb shows the hierarchy: ... > test-group > HighErrorRate
      await expect(page.getByTestId('data-testid test-group breadcrumb')).toBeVisible();
      await expect(page.getByTestId('data-testid HighErrorRate breadcrumb')).toBeVisible();
    });
  });
});
