import { Locator } from '@playwright/test';

export interface OpsgenieFormParams {
  apiKey?: string;
  apiUrl?: string;
  message?: string;
  description?: string;
  source?: string;
  tags?: string;
  note?: string;
  priority?: string;
}

export class OpsgenieIntegrationForm {
  readonly apiKeyInput: Locator;
  readonly apiUrlInput: Locator;
  readonly messageInput: Locator;
  readonly descriptionInput: Locator;
  readonly sourceInput: Locator;
  readonly tagsInput: Locator;
  readonly noteInput: Locator;
  readonly priorityInput: Locator;
  readonly addDetailButton: Locator;

  constructor(private readonly scope: Locator) {
    this.apiKeyInput = scope.getByLabel('API key', { exact: true });
    this.apiUrlInput = scope.getByLabel('API URL', { exact: true });
    this.messageInput = scope.getByLabel('Message', { exact: true });
    this.descriptionInput = scope.getByLabel('Description', { exact: true });
    this.sourceInput = scope.getByLabel('Source', { exact: true });
    this.tagsInput = scope.getByLabel('Tags', { exact: true });
    this.noteInput = scope.getByLabel('Note', { exact: true });
    this.priorityInput = scope.getByLabel('Priority', { exact: true });
    this.addDetailButton = scope.getByRole('button', { name: 'Add detail', exact: true });
  }

  async fill({ apiKey, apiUrl, message, description, source, tags, note, priority }: OpsgenieFormParams) {
    if (apiKey !== undefined) await this.apiKeyInput.fill(apiKey);
    if (apiUrl !== undefined) await this.apiUrlInput.fill(apiUrl);
    if (message !== undefined) await this.messageInput.fill(message);
    if (description !== undefined) await this.descriptionInput.fill(description);
    if (source !== undefined) await this.sourceInput.fill(source);
    if (tags !== undefined) await this.tagsInput.fill(tags);
    if (note !== undefined) await this.noteInput.fill(note);
    if (priority !== undefined) await this.priorityInput.fill(priority);
  }

  async addDetail(key: string, value: string) {
    await this.addDetailButton.click();
    await this.scope.getByLabel('Detail key', { exact: true }).last().fill(key);
    await this.scope.getByLabel('Detail value', { exact: true }).last().fill(value);
  }
}
