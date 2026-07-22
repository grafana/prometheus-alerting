import { expect, Locator, Page } from '@playwright/test';

export class GroupDetailsPage {
  readonly pageContent: Locator;
  readonly title: Locator;
  readonly ruleItems: Locator;
  readonly backLink: Locator;

  constructor(private readonly page: Page, private readonly pluginId: string) {
    this.pageContent = page.locator('#pageContent');
    this.title = this.pageContent.getByRole('heading', { level: 1 });
    this.ruleItems = this.pageContent.getByRole('treeitem');
    this.backLink = this.pageContent.getByRole('link', { name: 'Back to rules list' });
  }

  async goto(dataSourceUid: string, namespace: string, groupName: string) {
    await this.page.goto(this.getPath(dataSourceUid, namespace, groupName));
  }

  async waitForLoad(name: string) {
    await expect(this.title).toHaveText(name, { timeout: 30000 });
  }

  getPath(dataSourceUid: string, namespace: string, groupName: string): string {
    return `/a/${this.pluginId}/groups/${dataSourceUid}/${encodeURIComponent(namespace)}/${encodeURIComponent(groupName)}`;
  }

  getEditPath(dataSourceUid: string, namespace: string, groupName: string): string {
    return `${this.getPath(dataSourceUid, namespace, groupName)}/edit`;
  }

  getGroupEditLink(dataSourceUid: string, namespace: string, groupName: string): Locator {
    return this.pageContent.locator(`a[href="${this.getEditPath(dataSourceUid, namespace, groupName)}"]`);
  }
}
