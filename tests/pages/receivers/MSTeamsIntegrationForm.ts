import { Locator } from '@playwright/test';

export interface MSTeamsFormParams {
  webhookUrl?: string;
  title?: string;
  summary?: string;
  text?: string;
  proxyUrl?: string;
  tlsServerName?: string;
  authorizationCredentials?: string;
  basicAuthUsername?: string;
}

export class MSTeamsIntegrationForm {
  readonly webhookUrlInput: Locator;
  readonly titleInput: Locator;
  readonly summaryInput: Locator;
  readonly textInput: Locator;
  readonly proxyUrlInput: Locator;
  readonly tlsServerNameInput: Locator;
  readonly authorizationCredentialsInput: Locator;
  readonly basicAuthUsernameInput: Locator;

  constructor(scope: Locator) {
    this.webhookUrlInput = scope.getByLabel('Webhook URL', { exact: true });
    this.titleInput = scope.getByLabel('Title', { exact: true });
    this.summaryInput = scope.getByLabel('Summary', { exact: true });
    this.textInput = scope.getByLabel('Text', { exact: true });
    this.proxyUrlInput = scope.getByLabel('Proxy URL', { exact: true });
    this.tlsServerNameInput = scope.getByLabel('TLS server name', { exact: true });
    this.authorizationCredentialsInput = scope.getByLabel('Authorization credentials', { exact: true });
    this.basicAuthUsernameInput = scope.getByLabel('Basic authentication username', { exact: true });
  }

  async fill({
    webhookUrl,
    title,
    summary,
    text,
    proxyUrl,
    tlsServerName,
    authorizationCredentials,
    basicAuthUsername,
  }: MSTeamsFormParams) {
    if (webhookUrl !== undefined) await this.webhookUrlInput.fill(webhookUrl);
    if (title !== undefined) await this.titleInput.fill(title);
    if (summary !== undefined) await this.summaryInput.fill(summary);
    if (text !== undefined) await this.textInput.fill(text);
    if (proxyUrl !== undefined) await this.proxyUrlInput.fill(proxyUrl);
    if (tlsServerName !== undefined) await this.tlsServerNameInput.fill(tlsServerName);
    if (authorizationCredentials !== undefined) {
      await this.authorizationCredentialsInput.fill(authorizationCredentials);
    }
    if (basicAuthUsername !== undefined) await this.basicAuthUsernameInput.fill(basicAuthUsername);
  }
}
