import { Locator } from '@playwright/test';

export interface PagerDutyFormParams {
  routingKey?: string;
  serviceKey?: string;
  url?: string;
  client?: string;
  clientUrl?: string;
  description?: string;
  severity?: string;
  authorizationCredentials?: string;
  basicAuthUsername?: string;
}

export class PagerDutyIntegrationForm {
  readonly routingKeyInput: Locator;
  readonly serviceKeyInput: Locator;
  readonly urlInput: Locator;
  readonly clientInput: Locator;
  readonly clientUrlInput: Locator;
  readonly descriptionInput: Locator;
  readonly severityInput: Locator;
  readonly authorizationCredentialsInput: Locator;
  readonly basicAuthUsernameInput: Locator;
  readonly addDetailButton: Locator;

  constructor(private readonly scope: Locator) {
    this.routingKeyInput = scope.getByLabel('Routing key', { exact: true });
    this.serviceKeyInput = scope.getByLabel('Service key', { exact: true });
    this.urlInput = scope.getByLabel('URL', { exact: true }).first();
    this.clientInput = scope.getByLabel('Client', { exact: true });
    this.clientUrlInput = scope.getByLabel('Client URL', { exact: true });
    this.descriptionInput = scope.getByLabel('Description', { exact: true });
    this.severityInput = scope.getByLabel('Severity', { exact: true });
    this.authorizationCredentialsInput = scope.getByLabel('Authorization credentials', { exact: true });
    this.basicAuthUsernameInput = scope.getByLabel('Basic authentication username', { exact: true });
    this.addDetailButton = scope.getByRole('button', { name: 'Add detail', exact: true });
  }

  async fill({
    routingKey,
    serviceKey,
    url,
    client,
    clientUrl,
    description,
    severity,
    authorizationCredentials,
    basicAuthUsername,
  }: PagerDutyFormParams) {
    if (routingKey !== undefined) {
      await this.routingKeyInput.fill(routingKey);
    }
    if (serviceKey !== undefined) {
      await this.serviceKeyInput.fill(serviceKey);
    }
    if (url !== undefined) {
      await this.urlInput.fill(url);
    }
    if (client !== undefined) {
      await this.clientInput.fill(client);
    }
    if (clientUrl !== undefined) {
      await this.clientUrlInput.fill(clientUrl);
    }
    if (description !== undefined) {
      await this.descriptionInput.fill(description);
    }
    if (severity !== undefined) {
      await this.severityInput.fill(severity);
    }
    if (authorizationCredentials !== undefined) {
      await this.authorizationCredentialsInput.fill(authorizationCredentials);
    }
    if (basicAuthUsername !== undefined) {
      await this.basicAuthUsernameInput.fill(basicAuthUsername);
    }
  }

  async addDetail(key: string, value: string) {
    await this.addDetailButton.click();
    await this.scope.getByLabel('Detail key', { exact: true }).last().fill(key);
    await this.scope.getByLabel('Detail value', { exact: true }).last().fill(value);
  }
}
