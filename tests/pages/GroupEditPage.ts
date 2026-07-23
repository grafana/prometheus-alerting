import { expect, Locator, Page } from '@playwright/test';

export class GroupEditPage {
  readonly pageContent: Locator;
  readonly namespaceInput: Locator;
  readonly nameInput: Locator;
  readonly intervalInput: Locator;
  readonly ruleItems: Locator;
  readonly saveButton: Locator;
  readonly cancelLink: Locator;
  readonly deleteButton: Locator;

  constructor(private readonly page: Page, private readonly pluginId: string) {
    this.pageContent = page.locator('#pageContent');
    this.namespaceInput = this.pageContent.getByRole('textbox', { name: /^Namespace/ });
    this.nameInput = this.pageContent.getByRole('textbox', { name: /^Evaluation group name/ });
    this.intervalInput = this.pageContent.getByRole('textbox', { name: /^Evaluation interval/ });
    this.ruleItems = this.pageContent.getByTestId('reorder-alert-rule');
    this.saveButton = this.pageContent.getByRole('button', { name: 'Save', exact: true });
    this.cancelLink = this.pageContent.getByRole('link', { name: 'Cancel', exact: true });
    this.deleteButton = this.pageContent.getByRole('button', { name: 'Delete group', exact: true });
  }

  async goto(dataSourceUid: string, namespace: string, groupName: string) {
    await this.page.goto(
      `/a/${this.pluginId}/groups/${dataSourceUid}/${encodeURIComponent(namespace)}/${encodeURIComponent(groupName)}/edit`
    );
  }

  async waitForLoad() {
    await expect(this.namespaceInput).toBeVisible({ timeout: 30000 });
  }

  async reorder(sourceName: string, targetName: string) {
    const source = this.ruleItems.filter({ hasText: sourceName });
    const target = this.ruleItems.filter({ hasText: targetName });
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    if (!sourceBox || !targetBox) {
      throw new Error('Rule items must be visible before reordering');
    }
    await this.page.mouse.move(sourceBox.x + 10, sourceBox.y + sourceBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(targetBox.x + 10, targetBox.y + targetBox.height - 2, { steps: 20 });
    await this.page.mouse.up();
  }
}
