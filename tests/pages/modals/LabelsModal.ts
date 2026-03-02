import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for the Labels Editor Modal
 * This modal appears when clicking "Add labels" or "Edit labels" in the RuleEditor
 */
export class LabelsModal {
  readonly modal: Locator;
  readonly title: Locator;
  readonly addLabelButton: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(private page: Page) {
    // Find the dialog/modal for labels editing
    this.modal = page.getByRole('dialog', { name: /labels/i });

    // All selectors scoped to the modal
    this.title = this.modal.getByRole('heading', { name: /labels/i });
    this.addLabelButton = this.modal.getByRole('button', { name: /add label/i });
    this.cancelButton = this.modal.getByRole('button', { name: /cancel/i });
    this.saveButton = this.modal.getByRole('button', { name: /save/i });
  }

  /**
   * Wait for the modal to be visible
   */
  async waitForOpen(): Promise<void> {
    await this.modal.waitFor({ state: 'visible', timeout: 2000 });
  }

  /**
   * Add multiple labels
   * Note: The modal opens with one empty row already present
   */
  async addLabels(labels: Record<string, string>): Promise<void> {
    const entries = Object.entries(labels);

    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];

      // For the first label, use the existing empty row
      // For subsequent labels, click "Add label" to create a new row
      if (i > 0) {
        await this.addLabelButton.click();

        // Wait for new row to appear by checking the count increased
        const keyInputs = this.modal.getByRole('textbox', { name: /key/i });
        await keyInputs.nth(i).waitFor({ state: 'visible', timeout: 2000 });
      }

      // Find the last key and value inputs (the current row to fill)
      const keyInputs = this.modal.getByRole('textbox', { name: /key/i });
      const valueInputs = this.modal.getByRole('textbox', { name: /value/i });

      const keyInput = keyInputs.last();
      const valueInput = valueInputs.last();

      await keyInput.fill(key);
      await valueInput.fill(value);
    }
  }

  /**
   * Click Save button to save labels and close modal
   */
  async save(): Promise<void> {
    await this.saveButton.click();
    // Wait for modal to close
    await expect(this.modal).not.toBeVisible({ timeout: 3000 });
  }

  /**
   * Click Cancel button to close modal without saving
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    // Wait for modal to close
    await expect(this.modal).not.toBeVisible({ timeout: 3000 });
  }

  /**
   * Check if the Save button is disabled
   */
  async isSaveDisabled(): Promise<boolean> {
    return await this.saveButton.isDisabled();
  }

  /**
   * Get the number of label rows in the modal
   */
  async getLabelCount(): Promise<number> {
    const keyInputs = this.modal.getByRole('textbox', { name: /key/i });
    return await keyInputs.count();
  }

  /**
   * Edit an existing label's value by finding it by key
   */
  async editLabel(key: string, newValue: string): Promise<void> {
    const keyInputs = this.modal.getByRole('textbox', { name: /key/i });
    const valueInputs = this.modal.getByRole('textbox', { name: /value/i });

    const count = await keyInputs.count();

    // Find the row with the matching key
    for (let i = 0; i < count; i++) {
      const keyInput = keyInputs.nth(i);
      const currentKey = await keyInput.inputValue();

      if (currentKey === key) {
        // Found the matching row, update the value
        const valueInput = valueInputs.nth(i);
        await valueInput.clear();
        await valueInput.fill(newValue);
        return;
      }
    }

    throw new Error(`Label with key "${key}" not found`);
  }

  /**
   * Remove a label by finding its delete button
   */
  async removeLabel(key: string): Promise<void> {
    const initialCount = await this.getLabelCount();

    const deleteButton = this.modal.getByRole('button', {
      name: new RegExp(`Remove label ${key}`, 'i'),
    });
    await deleteButton.click();

    // Wait for the label row to be removed by checking the button is gone
    await expect(deleteButton).not.toBeVisible({ timeout: 2000 });

    // Verify count decreased (unless it was the last label, then an empty one is added)
    const newCount = await this.getLabelCount();
    if (initialCount === 1) {
      // If it was the last label, an empty one is added back
      expect(newCount).toBe(1);
    } else {
      // Otherwise, count should decrease
      expect(newCount).toBe(initialCount - 1);
    }
  }
}
