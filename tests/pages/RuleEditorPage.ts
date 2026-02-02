import { expect, Locator, Page } from '@playwright/test';
import { CloudRuleIdentifier, stringifyIdentifier } from '@grafana/external-rules';
import { LabelsModal } from './modals/LabelsModal';

/**
 * Page Object Model for the RuleEditor page
 * Handles creation, editing, and cloning of alert and recording rules
 */
export class RuleEditorPage {
  // Page structure
  readonly pageTitle: Locator;
  readonly pageContent: Locator;

  // Loading and error states
  readonly loadingAlert: Locator;
  readonly errorAlert: Locator;
  readonly notFoundAlert: Locator;

  // Step 1: Definition
  readonly ruleNameInput: Locator;
  readonly dataSourcePickerInput: Locator;

  // Step 2: Evaluation
  readonly pendingPeriodInput: Locator;
  readonly pendingPeriodUnitSelect: Locator;
  readonly namespaceCombobox: Locator;
  readonly groupCombobox: Locator;

  // Step 3: Labels
  readonly labelsSection: Locator;
  readonly addLabelsButton: Locator;
  readonly editLabelsButton: Locator;

  // Step 4: Annotations
  readonly annotationsSection: Locator;
  readonly addAnnotationButton: Locator;

  // Actions
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(private page: Page, private pluginId: string) {
    // Scope all selectors to page content
    this.pageContent = page.locator('#pageContent');

    // Page structure
    this.pageTitle = this.pageContent.getByRole('heading', { level: 1 });

    // Loading and error states
    this.loadingAlert = this.pageContent.getByText(/loading/i);
    this.errorAlert = this.pageContent.getByRole('alert').filter({ hasText: /error/i });
    this.notFoundAlert = this.pageContent.getByRole('alert').filter({ hasText: /not found/i });

    // Step 1: Definition
    this.ruleNameInput = this.pageContent.locator('#rule-name');
    // Data source picker is a Combobox - find the input element
    this.dataSourcePickerInput = this.pageContent.getByRole('combobox').first();

    // Step 2: Evaluation
    // Pending period - look for the spinbutton near "Pending period" text
    this.pendingPeriodInput = this.pageContent.getByRole('spinbutton').first();
    this.pendingPeriodUnitSelect = this.pageContent.getByRole('combobox').nth(1); // Second combobox (first is data source)
    this.namespaceCombobox = this.pageContent.getByRole('combobox', { name: /namespace/i });
    this.groupCombobox = this.pageContent.getByRole('combobox', { name: /group/i });

    // Step 3: Labels
    this.labelsSection = this.pageContent.getByText(/labels/i).locator('..');
    this.addLabelsButton = this.pageContent.getByRole('button', { name: /add label/i });
    this.editLabelsButton = this.pageContent.getByRole('button', { name: /edit labels/i });

    // Step 4: Annotations
    // Find the annotations section by its heading
    const annotationsHeading = this.pageContent.getByRole('heading', { name: /annotations/i });
    // The annotations section is the parent container of the heading
    this.annotationsSection = annotationsHeading.locator('..').locator('..');
    this.addAnnotationButton = this.pageContent.getByRole('button', { name: /add custom annotation/i });

    // Actions
    this.saveButton = this.pageContent.getByRole('button', { name: /save/i });
    this.cancelButton = this.pageContent.getByRole('button', { name: /cancel/i });
  }

  /**
   * Navigate to new rule creation page
   */
  async gotoNew(type: 'alerting' | 'recording'): Promise<void> {
    const baseUrl = this.page.url().match(/^https?:\/\/[^/]+/)?.[0] || 'http://localhost:3000';
    await this.page.goto(`${baseUrl}/a/grafana-prometheusalerting-app/rules/new?type=${type}`);
  }

  /**
   * Navigate to edit rule page
   */
  async gotoEdit(identifier: CloudRuleIdentifier): Promise<void> {
    const encodedId = encodeURIComponent(stringifyIdentifier(identifier));
    const baseUrl = this.page.url().match(/^https?:\/\/[^/]+/)?.[0] || 'http://localhost:3000';
    await this.page.goto(`${baseUrl}/a/grafana-prometheusalerting-app/rules/${encodedId}/edit`);
  }

  /**
   * Navigate to clone rule page
   */
  async gotoClone(identifier: CloudRuleIdentifier): Promise<void> {
    const encodedId = encodeURIComponent(stringifyIdentifier(identifier));
    const baseUrl = this.page.url().match(/^https?:\/\/[^/]+/)?.[0] || 'http://localhost:3000';
    await this.page.goto(`${baseUrl}/a/grafana-prometheusalerting-app/rules/new?copyFrom=${encodedId}`);
  }

  /**
   * Wait for the page to finish loading
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the page title text
   */
  async getPageTitle(): Promise<string> {
    return await this.pageTitle.innerText();
  }

  /**
   * Check if the page is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingAlert.isVisible().catch(() => false);
  }

  /**
   * Check if the page shows an error
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible().catch(() => false);
  }

  /**
   * Fill in the rule name
   */
  async fillRuleName(name: string): Promise<void> {
    await this.ruleNameInput.clear();
    await this.ruleNameInput.fill(name);
    await this.ruleNameInput.blur();
  }

  /**
   * Select a data source by name (using Grafana UI Combobox)
   */
  async selectDataSource(dataSourceName: string): Promise<void> {
    // Find the combobox by looking for the first combobox in the page content
    const combobox = this.pageContent.getByRole('combobox').first();

    // Click to open the dropdown
    await combobox.click();

    // Wait for dropdown to appear - Grafana Combobox uses either role="option" or role="menuitem"
    // Try multiple selectors to find the option
    const optionByRole = this.page.getByRole('option', { name: dataSourceName });
    const optionByMenuItem = this.page.getByRole('menuitem', { name: dataSourceName });
    const optionByListbox = this.page.locator('[role="listbox"]').getByText(dataSourceName, { exact: true });
    const optionByText = this.page.locator('[data-testid="data-source-card"]').filter({ hasText: dataSourceName });

    // Try each selector with a short timeout
    let found = false;
    for (const option of [optionByRole, optionByMenuItem, optionByListbox, optionByText]) {
      try {
        await option.waitFor({ state: 'visible', timeout: 1500 });
        await option.click();
        found = true;
        break;
      } catch {
        // Continue to next selector
      }
    }

    if (!found) {
      // Last resort: type in the combobox and press Enter
      await combobox.fill(dataSourceName);
      await this.page.waitForTimeout(500);
      await combobox.press('Enter');
    }

    // Wait for query editor (Monaco editor) to load after selection
    const queryField = this.pageContent.getByRole('textbox', { name: /Editor content/i });
    await queryField.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Fill in the expression/query
   * Must be called AFTER selecting a data source
   */
  async fillExpression(expression: string): Promise<void> {
    // Find the Monaco editor textbox (accessible name includes "Editor content")
    const queryField = this.pageContent.getByRole('textbox', { name: /Editor content/i });

    // Wait for the editor to be visible and enabled
    await queryField.waitFor({ state: 'visible', timeout: 2000 });

    // Click to focus the editor
    await queryField.click();

    // Clear and type new expression
    await this.page.keyboard.press('ControlOrMeta+A');
    await queryField.fill(expression);

    // Blur the editor to trigger onChange and commit the value
    await queryField.blur();
  }

  /**
   * Set the pending period (for duration)
   */
  async setPendingPeriod(value: number, unit: string): Promise<void> {
    // Fill the spinbutton with the value
    await this.pendingPeriodInput.click();
    await this.pendingPeriodInput.fill(value.toString());

    // Select the unit - click combobox and select option
    await this.pendingPeriodUnitSelect.click();
    const unitOption = this.page.getByRole('option', { name: unit });
    await unitOption.waitFor({ state: 'visible', timeout: 2000 });
    await unitOption.click();
  }

  /**
   * Select or create a namespace
   */
  async selectNamespace(namespace: string): Promise<void> {
    await this.namespaceCombobox.click();
    await this.namespaceCombobox.fill(namespace);
    // Try to select existing option or create new
    const existingOption = this.page.getByRole('option', { name: namespace, exact: true });
    
    // Wait a bit for the dropdown to appear and check if option exists
    try {
      await existingOption.waitFor({ state: 'visible', timeout: 1000 });
      await existingOption.click();
    } catch {
      // Option doesn't exist, press Enter to create new namespace
      await this.namespaceCombobox.press('Enter');
    }
  }

  /**
   * Select or create a group
   */
  async selectGroup(group: string): Promise<void> {
    await this.groupCombobox.click();
    await this.groupCombobox.fill(group);
    // Try to select existing option or create new
    const existingOption = this.page.getByRole('option', { name: group, exact: true });
    
    // Wait a bit for the dropdown to appear and check if option exists
    try {
      await existingOption.waitFor({ state: 'visible', timeout: 1000 });
      await existingOption.click();
    } catch {
      // Option doesn't exist, press Enter to create new group
      await this.groupCombobox.press('Enter');
    }
  }

  /**
   * Open the labels editor modal
   * Returns a LabelsModal instance that can be used to add labels and save
   */
  async openLabelsModal(): Promise<LabelsModal> {
    // Click add labels button (or edit if labels already exist)
    const addButton = this.addLabelsButton;
    const isAddButtonVisible = await addButton.isVisible().catch(() => false);

    if (isAddButtonVisible) {
      await addButton.click();
    } else {
      // If edit button is visible, click it instead
      const editButton = this.editLabelsButton;
      const isEditButtonVisible = await editButton.isVisible().catch(() => false);
      if (isEditButtonVisible) {
        await editButton.click();
      }
    }

    // Create and return the modal instance
    const modal = new LabelsModal(this.page);
    await modal.waitForOpen();
    return modal;
  }

  /**
   * Add an annotation to the rule
   */
  async addAnnotation(key: string, value: string): Promise<void> {
    // Scroll button into view and wait for it to be visible
    await this.addAnnotationButton.scrollIntoViewIfNeeded();
    await this.addAnnotationButton.waitFor({ state: 'visible', timeout: 3000 });

    // Click add annotation button
    await this.addAnnotationButton.click();

    // Find the LAST annotation key and value inputs (the newly added row)
    const keyInputs = this.pageContent.getByPlaceholder('Annotation key');
    const valueInputs = this.pageContent.getByPlaceholder('Annotation value');

    const keyInput = keyInputs.last();
    const valueInput = valueInputs.last();

    // Wait for annotation fields to appear
    await keyInput.waitFor({ state: 'visible', timeout: 2000 });

    await keyInput.fill(key);
    await valueInput.fill(value);

    // Blur the value field to commit the changes
    await valueInput.blur();
  }

  /**
   * Check if annotations section is visible (only for alerting rules)
   */
  async hasAnnotationsSection(): Promise<boolean> {
    return await this.annotationsSection.isVisible().catch(() => false);
  }

  /**
   * Click the Save button
   */
  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Click the Cancel button
   */
  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Check if the Save button is disabled
   */
  async isSaveDisabled(): Promise<boolean> {
    const isDisabled = await this.saveButton.isDisabled();
    return isDisabled;
  }

  /**
   * Get field validation error message
   */
  async getFieldError(fieldLabel: string): Promise<string | null> {
    // Look for error message near the field with the given label
    const fieldContainer = this.pageContent.getByText(fieldLabel).locator('..');
    const errorMessage = fieldContainer.locator('[role="alert"], .error-message').first();

    const isVisible = await errorMessage.isVisible().catch(() => false);
    if (isVisible) {
      return await errorMessage.innerText();
    }

    return null;
  }

  /**
   * Get the current rule name value
   */
  async getRuleName(): Promise<string> {
    return await this.ruleNameInput.inputValue();
  }

  /**
   * Get the current expression value
   */
  async getExpression(): Promise<string> {
    const queryField = this.pageContent.getByRole('textbox', { name: /Editor content/i });
    return await queryField.inputValue();
  }

  /**
   * Get the number of annotations currently in the form
   */
  async getAnnotationCount(): Promise<number> {
    const keyInputs = this.pageContent.getByPlaceholder('Annotation key');
    return await keyInputs.count();
  }

  /**
   * Edit an existing annotation's value by finding it by key
   */
  async editAnnotation(key: string, newValue: string): Promise<void> {
    const keyInputs = this.pageContent.getByPlaceholder('Annotation key');
    const valueInputs = this.pageContent.getByPlaceholder('Annotation value');

    const count = await keyInputs.count();
    
    // Find the annotation with the matching key
    for (let i = 0; i < count; i++) {
      const keyInput = keyInputs.nth(i);
      const currentKey = await keyInput.inputValue();
      
      if (currentKey === key) {
        // Found the matching annotation, update the value
        const valueInput = valueInputs.nth(i);
        await valueInput.clear();
        await valueInput.fill(newValue);
        await valueInput.blur();
        return;
      }
    }
    
    throw new Error(`Annotation with key "${key}" not found`);
  }

  /**
   * Remove an annotation by finding its delete button
   */
  async removeAnnotation(key: string): Promise<void> {
    const initialCount = await this.getAnnotationCount();
    
    const deleteButton = this.pageContent.getByRole('button', {
      name: new RegExp(`Remove annotation ${key}`, 'i'),
    });
    await deleteButton.click();
    
    // Wait for the annotation row to be removed by checking the button is gone
    await expect(deleteButton).not.toBeVisible({ timeout: 2000 });
    
    // Verify count decreased
    const newCount = await this.getAnnotationCount();
    expect(newCount).toBe(initialCount - 1);
  }
}
