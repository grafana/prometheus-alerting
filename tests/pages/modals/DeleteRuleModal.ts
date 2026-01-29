import { Locator, Page, expect } from '@playwright/test';

/**
 * Page Object Model for the Delete Rule Modal
 */
export class DeleteRuleModal {
  readonly modal: Locator;
  readonly title: Locator;
  readonly message: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly errorMessage: Locator;

  constructor(private page: Page) {
    this.modal = page.getByRole('dialog', { name: /delete rule/i });
    this.title = this.modal.getByRole('heading', { name: /delete rule/i });
    this.message = this.modal.getByText(/are you sure/i);
    this.cancelButton = this.modal.getByRole('button', { name: /cancel/i });
    this.deleteButton = this.modal.getByRole('button', { name: /^delete/i });
    this.errorMessage = this.modal.getByText(/error:/i);
  }

  /**
   * Wait for the modal to be visible
   */
  async waitForOpen(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  /**
   * Get the confirmation message text
   */
  async getMessage(): Promise<string> {
    return (await this.message.textContent()) ?? '';
  }

  /**
   * Click the delete button and wait for the modal to close
   */
  async confirmDelete(): Promise<void> {
    await this.deleteButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  /**
   * Click the cancel button and wait for the modal to close
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  /**
   * Check if the delete operation is in progress
   */
  async isDeleting(): Promise<boolean> {
    const isDisabled = await this.deleteButton.isDisabled();
    const text = await this.deleteButton.textContent();
    return isDisabled || (text?.toLowerCase().includes('deleting') ?? false);
  }

  /**
   * Check if an error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get the error message text if present
   */
  async getErrorText(): Promise<string | null> {
    if (await this.hasError()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
}
