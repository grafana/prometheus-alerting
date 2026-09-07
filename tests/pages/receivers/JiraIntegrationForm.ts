import { Locator } from '@playwright/test';

export interface JiraFormParams {
  apiUrl?: string;
  project?: string;
  issueType?: string;
  summary?: string;
  description?: string;
  labels?: string;
  priority?: string;
  reopenDuration?: string;
}

export class JiraIntegrationForm {
  readonly apiUrlInput: Locator;
  readonly projectInput: Locator;
  readonly issueTypeInput: Locator;
  readonly summaryInput: Locator;
  readonly descriptionInput: Locator;
  readonly labelsInput: Locator;
  readonly priorityInput: Locator;
  readonly reopenDurationInput: Locator;
  readonly addFieldButton: Locator;

  constructor(private readonly scope: Locator) {
    this.apiUrlInput = scope.getByLabel('API URL', { exact: true });
    this.projectInput = scope.getByLabel('Project key', { exact: true });
    this.issueTypeInput = scope.getByLabel('Issue type', { exact: true });
    this.summaryInput = scope.getByLabel('Summary', { exact: true });
    this.descriptionInput = scope.getByLabel('Description', { exact: true });
    this.labelsInput = scope.getByLabel('Labels', { exact: true });
    this.priorityInput = scope.getByLabel('Priority', { exact: true });
    this.reopenDurationInput = scope.getByLabel('Reopen duration', { exact: true });
    this.addFieldButton = scope.getByRole('button', { name: 'Add field', exact: true });
  }

  async fill(params: JiraFormParams) {
    const fields: Array<[keyof JiraFormParams, Locator]> = [
      ['apiUrl', this.apiUrlInput],
      ['project', this.projectInput],
      ['issueType', this.issueTypeInput],
      ['summary', this.summaryInput],
      ['description', this.descriptionInput],
      ['labels', this.labelsInput],
      ['priority', this.priorityInput],
      ['reopenDuration', this.reopenDurationInput],
    ];
    for (const [key, input] of fields) {
      const value = params[key];
      if (value !== undefined) await input.fill(value);
    }
  }

  async addField(key: string, value: string) {
    await this.addFieldButton.click();
    await this.scope.getByLabel('Field key', { exact: true }).last().fill(key);
    await this.scope.getByLabel('Field value', { exact: true }).last().fill(value);
  }
}
