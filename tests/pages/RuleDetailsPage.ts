import { Locator, Page, expect } from '@playwright/test';
import { DataSourceRuleIdentifier, stringifyIdentifier } from '@grafana/external-rules/identifiers';
import { DeleteRuleModal } from './modals/DeleteRuleModal';

/**
 * Page Object Model for the RuleDetails page
 */
export class RuleDetailsPage {
  // Page elements
  readonly pageTitle: Locator;
  readonly stateBadge: Locator; // Note: matches both state and health badges
  readonly loadingPlaceholder: Locator;
  readonly errorAlert: Locator;
  readonly notFoundAlert: Locator;

  // Action buttons
  readonly editButton: Locator;
  readonly moreActionsButton: Locator;

  // Tabs
  readonly queryTab: Locator;
  readonly instancesTab: Locator;
  readonly detailsTab: Locator;

  // Tab content
  readonly queryExpression: Locator;
  readonly instancesTable: Locator;
  readonly detailsTable: Locator;

  constructor(private page: Page, private pluginId: string) {
    // Scope selectors to page content
    const pageContent = page.locator('#pageContent');

    // Page elements - there's only one H1 within the page content area
    this.pageTitle = pageContent.getByRole('heading', { level: 1 });
    this.stateBadge = page.getByLabel(/^Rule (state|health):/);

    // Loading and error states
    this.loadingPlaceholder = pageContent.getByText(/loading rule details/i);
    this.errorAlert = pageContent.getByRole('alert').filter({ hasText: /error loading rule/i });
    this.notFoundAlert = pageContent.getByRole('alert').filter({ hasText: /rule not found/i });

    // Action buttons
    this.editButton = pageContent.getByRole('link', { name: /edit/i });
    this.moreActionsButton = pageContent.getByRole('button', { name: 'More', exact: true });

    // Tabs
    this.queryTab = pageContent.getByRole('tab', { name: /query/i });
    this.instancesTab = pageContent.getByRole('tab', { name: /instances/i });
    this.detailsTab = pageContent.getByRole('tab', { name: /details/i });

    // Tab content
    this.queryExpression = pageContent.getByText(/^up == 0|^sum\(up\)/);
    this.instancesTable = pageContent.locator('table');
    this.detailsTable = pageContent.locator('dl, div[role="definition"]');
  }

  /**
   * Navigate to the rule details page
   */
  async goto(identifier: DataSourceRuleIdentifier): Promise<void> {
    const encodedId = encodeURIComponent(stringifyIdentifier(identifier));
    const baseUrl = this.page.url().match(/^https?:\/\/[^/]+/)?.[0] || 'http://localhost:3000';
    await this.page.goto(`${baseUrl}/a/grafana-prometheusalerting-app/rules/${encodedId}`);
  }

  /**
   * Wait for the page to finish loading (either success, error, or not found state)
   */
  async waitForLoad(): Promise<void> {
    // Wait for network to be idle (all API calls complete)
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Switch to a specific tab
   */
  async switchToTab(tabName: 'query' | 'instances' | 'details'): Promise<void> {
    const tabMap = {
      query: this.queryTab,
      instances: this.instancesTab,
      details: this.detailsTab,
    };

    const tab = tabMap[tabName];
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }

  /**
   * Get the query expression text
   */
  async getQueryExpression(): Promise<string> {
    await this.switchToTab('query');
    // Look for the query in a code block or pre element within page content
    const pageContent = this.page.locator('#pageContent');
    const queryElement = pageContent
      .locator('pre, code')
      .filter({ hasText: /==|sum|rate/ })
      .first();
    return await queryElement.innerText();
  }

  /**
   * Get the rule name from the page title
   */
  async getRuleName(): Promise<string> {
    return await this.pageTitle.innerText();
  }

  /**
   * Get the state (e.g., "Firing", "Pending", "Normal")
   */
  async getState(): Promise<string> {
    return await this.stateBadge.innerText();
  }

  /**
   * Check if the state/health badge is visible
   * Note: The component shows a single badge that displays either state or health
   */
  async hasStateBadge(): Promise<boolean> {
    return await this.stateBadge.isVisible();
  }

  /**
   * Get labels from the page metadata section
   */
  async getLabels(): Promise<Record<string, string>> {
    // Labels are displayed in a container with aria-label within page content
    const pageContent = this.page.locator('#pageContent');
    const labelsSection = pageContent.getByLabel('Rule labels');

    // Wait for labels section to be visible (will use default timeout)
    await labelsSection.waitFor({ state: 'visible' });

    // AlertLabels component renders each label as a listitem with aria-label="key: value"
    const labelItems = labelsSection.locator('[role="listitem"]');
    const count = await labelItems.count();

    const labels: Record<string, string> = {};
    for (let i = 0; i < count; i++) {
      const ariaLabel = await labelItems.nth(i).getAttribute('aria-label');
      if (ariaLabel) {
        // aria-label format: "key: value"
        const [key, value] = ariaLabel.split(':').map((s) => s.trim());
        if (key && value) {
          labels[key] = value;
        }
      }
    }

    return labels;
  }

  /**
   * Click the Edit button
   */
  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }

  /**
   * Click the Delete action from the more menu
   */
  async clickDelete(): Promise<DeleteRuleModal> {
    // Click more actions button
    await this.moreActionsButton.click();

    // Click delete menu item
    const deleteMenuItem = this.page.getByRole('menuitem', { name: /delete/i });
    await deleteMenuItem.click();

    // Return modal instance
    return new DeleteRuleModal(this.page);
  }

  /**
   * Click the Duplicate action from the more menu
   */
  async clickDuplicate(): Promise<void> {
    // Click more actions button
    await this.moreActionsButton.click();

    // Click duplicate menu item
    const duplicateMenuItem = this.page.getByRole('menuitem', { name: /duplicate/i });
    await duplicateMenuItem.click();
  }

  /**
   * Copy the rule link to clipboard
   */
  async copyLink(): Promise<void> {
    // Click more actions button
    await this.moreActionsButton.click();

    // Click copy link menu item
    const copyLinkMenuItem = this.page.getByRole('menuitem', { name: /copy link/i });
    await copyLinkMenuItem.click();

    // Wait a bit for clipboard operation
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if the instances tab is visible (only for alerting rules)
   */
  async hasInstancesTab(): Promise<boolean> {
    return await this.instancesTab.isVisible();
  }

  /**
   * Get the number of instances shown in the tab counter
   */
  async getInstancesCount(): Promise<number> {
    if (!(await this.hasInstancesTab())) {
      return 0;
    }

    // Look for counter badge on the instances tab
    const counterText = await this.instancesTab.getAttribute('data-counter');
    if (counterText) {
      return parseInt(counterText, 10);
    }

    // Alternative: look for counter in tab label text
    const tabText = await this.instancesTab.textContent();
    const match = tabText?.match(/\((\d+)\)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    return 0;
  }

  /**
   * Check if the Edit button is visible
   */
  async hasEditButton(): Promise<boolean> {
    return await this.editButton.isVisible();
  }

  /**
   * Get the breadcrumb navigation hierarchy
   */
  async getBreadcrumbs(): Promise<string[]> {
    const breadcrumbs: string[] = [];
    const breadcrumbNav = this.page.locator('nav[aria-label="Breadcrumb"], ol[role="list"]').first();

    if (await breadcrumbNav.isVisible()) {
      const items = breadcrumbNav.locator('a, span').filter({ hasNotText: /^>$/ });
      const count = await items.count();

      for (let i = 0; i < count; i++) {
        const text = await items.nth(i).textContent();
        if (text) {
          breadcrumbs.push(text.trim());
        }
      }
    }

    return breadcrumbs;
  }

  /**
   * Check if page is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingPlaceholder.isVisible();
  }

  /**
   * Check if page shows an error
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  /**
   * Check if page shows not found state
   */
  async isNotFound(): Promise<boolean> {
    return await this.notFoundAlert.isVisible();
  }

  /**
   * Get the error message if one is displayed
   */
  async getErrorMessage(): Promise<string | null> {
    if (await this.hasError()) {
      return await this.errorAlert.textContent();
    }
    return null;
  }

  /**
   * Check if the page shows a consistency/propagation warning
   * This appears when a rule is newly created and not yet visible in Prometheus
   */
  async hasConsistencyWarning(): Promise<boolean> {
    const pageContent = this.page.locator('#pageContent');
    const consistencyAlert = pageContent.getByRole('alert').filter({ hasText: /propagat|being propagated/i });
    return await consistencyAlert.isVisible();
  }

  /**
   * Wait for the consistency warning to disappear (rule is now consistent)
   * @param timeout Maximum time to wait in milliseconds (default: 120000 = 2 minutes)
   */
  async waitForConsistency(timeout = 120000): Promise<void> {
    const pageContent = this.page.locator('#pageContent');
    const consistencyAlert = pageContent.getByRole('alert').filter({ hasText: /propagat|being propagated/i });

    // Wait for the alert to disappear
    await expect(consistencyAlert).not.toBeVisible({ timeout });
  }

  /**
   * Check if only the "Copy Link" action is available (read-only mode)
   */
  async isReadOnlyMode(): Promise<boolean> {
    // In read-only mode, there's no Edit button
    const hasEdit = await this.hasEditButton();
    if (hasEdit) {
      return false;
    }

    // Click more actions to check available actions
    await this.moreActionsButton.click();

    // Check if Delete and Duplicate are not available
    const deleteMenuItem = this.page.getByRole('menuitem', { name: /delete/i });
    const duplicateMenuItem = this.page.getByRole('menuitem', { name: /duplicate/i });
    const copyLinkMenuItem = this.page.getByRole('menuitem', { name: /copy link/i });

    const hasDelete = await deleteMenuItem.isVisible().catch(() => false);
    const hasDuplicate = await duplicateMenuItem.isVisible().catch(() => false);
    const hasCopyLink = await copyLinkMenuItem.isVisible().catch(() => false);

    // Close the menu by clicking elsewhere
    await this.page.keyboard.press('Escape');

    // Read-only mode has only Copy Link
    return !hasDelete && !hasDuplicate && hasCopyLink;
  }
}
