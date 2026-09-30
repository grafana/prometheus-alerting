import { Locator } from '@playwright/test';

export interface DiscordFormParams {
  webhookUrl?: string;
  title?: string;
  message?: string;
  authorizationCredentials?: string;
  basicAuthUsername?: string;
}

export class DiscordIntegrationForm {
  readonly webhookUrlInput: Locator;
  readonly titleInput: Locator;
  readonly messageInput: Locator;
  readonly authorizationCredentialsInput: Locator;
  readonly basicAuthUsernameInput: Locator;

  constructor(scope: Locator) {
    this.webhookUrlInput = scope.getByLabel('Webhook URL', { exact: true });
    this.titleInput = scope.getByLabel('Title', { exact: true });
    this.messageInput = scope.getByLabel('Message content', { exact: true });
    this.authorizationCredentialsInput = scope.getByLabel('Authorization credentials', { exact: true });
    this.basicAuthUsernameInput = scope.getByLabel('Basic authentication username', { exact: true });
  }

  async fill({ webhookUrl, title, message, authorizationCredentials, basicAuthUsername }: DiscordFormParams) {
    if (webhookUrl !== undefined) await this.webhookUrlInput.fill(webhookUrl);
    if (title !== undefined) await this.titleInput.fill(title);
    if (message !== undefined) await this.messageInput.fill(message);
    if (authorizationCredentials !== undefined) {
      await this.authorizationCredentialsInput.fill(authorizationCredentials);
    }
    if (basicAuthUsername !== undefined) await this.basicAuthUsernameInput.fill(basicAuthUsername);
  }
}
