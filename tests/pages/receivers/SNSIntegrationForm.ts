import { Locator } from '@playwright/test';

export interface SNSFormParams {
  apiUrl?: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
  profile?: string;
  roleArn?: string;
  topicArn?: string;
  phoneNumber?: string;
  targetArn?: string;
  subject?: string;
  message?: string;
}

export class SNSIntegrationForm {
  readonly apiUrlInput: Locator;
  readonly regionInput: Locator;
  readonly accessKeyInput: Locator;
  readonly secretKeyInput: Locator;
  readonly profileInput: Locator;
  readonly roleArnInput: Locator;
  readonly topicArnInput: Locator;
  readonly phoneNumberInput: Locator;
  readonly targetArnInput: Locator;
  readonly subjectInput: Locator;
  readonly messageInput: Locator;
  readonly addAttributeButton: Locator;

  constructor(private readonly scope: Locator) {
    this.apiUrlInput = scope.getByLabel('API URL', { exact: true });
    this.regionInput = scope.getByLabel('Region', { exact: true });
    this.accessKeyInput = scope.getByLabel('Access key', { exact: true });
    this.secretKeyInput = scope.getByLabel('Secret key', { exact: true });
    this.profileInput = scope.getByLabel('Profile', { exact: true });
    this.roleArnInput = scope.getByLabel('Role ARN', { exact: true });
    this.topicArnInput = scope.getByLabel('SNS topic ARN', { exact: true });
    this.phoneNumberInput = scope.getByLabel('Phone number', { exact: true });
    this.targetArnInput = scope.getByLabel('Target ARN', { exact: true });
    this.subjectInput = scope.getByLabel('Subject', { exact: true });
    this.messageInput = scope.getByLabel('Message', { exact: true });
    this.addAttributeButton = scope.getByRole('button', { name: 'Add attribute', exact: true });
  }

  async fill(params: SNSFormParams) {
    const fields: Array<[keyof SNSFormParams, Locator]> = [
      ['apiUrl', this.apiUrlInput],
      ['region', this.regionInput],
      ['accessKey', this.accessKeyInput],
      ['secretKey', this.secretKeyInput],
      ['profile', this.profileInput],
      ['roleArn', this.roleArnInput],
      ['topicArn', this.topicArnInput],
      ['phoneNumber', this.phoneNumberInput],
      ['targetArn', this.targetArnInput],
      ['subject', this.subjectInput],
      ['message', this.messageInput],
    ];
    for (const [key, input] of fields) {
      const value = params[key];
      if (value !== undefined) await input.fill(value);
    }
  }

  async addAttribute(key: string, value: string) {
    await this.addAttributeButton.click();
    await this.scope.getByLabel('Attribute key', { exact: true }).last().fill(key);
    await this.scope.getByLabel('Attribute value', { exact: true }).last().fill(value);
  }
}
