import { Locator } from '@playwright/test';

export interface WebexFormParams {
  apiUrl?: string;
  roomId?: string;
  message?: string;
  authorizationType?: string;
  authorizationCredentials?: string;
  authorizationCredentialsFile?: string;
  basicAuthUsername?: string;
  proxyUrl?: string;
  tlsServerName?: string;
  tlsSkipVerify?: boolean;
}

/**
 * Sub-page-object for a Webex integration's fields within the receiver drawer's create/edit form.
 * Authorization credentials are required by Alertmanager to authorize requests to Webex. TLS file
 * fields are deliberately omitted because the test Mimir instance rejects local file paths in
 * receiver configurations.
 */
export class WebexIntegrationForm {
  readonly apiUrlInput: Locator;
  readonly roomIdInput: Locator;
  readonly messageInput: Locator;
  readonly authorizationTypeInput: Locator;
  readonly authorizationCredentialsInput: Locator;
  readonly authorizationCredentialsFileInput: Locator;
  readonly basicAuthUsernameInput: Locator;
  readonly proxyUrlInput: Locator;
  readonly tlsServerNameInput: Locator;
  readonly tlsSkipVerifyCheckbox: Locator;

  constructor(scope: Locator) {
    this.apiUrlInput = scope.getByLabel('API URL', { exact: true });
    this.roomIdInput = scope.getByLabel('Room ID', { exact: true });
    this.messageInput = scope.getByLabel('Message', { exact: true });
    this.authorizationTypeInput = scope.getByLabel('Authorization type', { exact: true });
    this.authorizationCredentialsInput = scope.getByLabel('Credentials', { exact: true });
    this.authorizationCredentialsFileInput = scope.getByLabel('Credentials file', { exact: true });
    this.basicAuthUsernameInput = scope.getByLabel('Username', { exact: true });
    this.proxyUrlInput = scope.getByLabel('Proxy URL', { exact: true });
    this.tlsServerNameInput = scope.getByLabel('Server name', { exact: true });
    this.tlsSkipVerifyCheckbox = scope.getByLabel('Skip verify', { exact: true });
  }

  /** Fill any subset of the Webex integration's top-level and HTTP configuration fields. */
  async fill({
    apiUrl,
    roomId,
    message,
    authorizationType,
    authorizationCredentials,
    authorizationCredentialsFile,
    basicAuthUsername,
    proxyUrl,
    tlsServerName,
    tlsSkipVerify,
  }: WebexFormParams) {
    if (apiUrl !== undefined) {
      await this.apiUrlInput.fill(apiUrl);
    }
    if (roomId !== undefined) {
      await this.roomIdInput.fill(roomId);
    }
    if (message !== undefined) {
      await this.messageInput.fill(message);
    }
    if (authorizationType !== undefined) {
      await this.authorizationTypeInput.fill(authorizationType);
    }
    if (authorizationCredentials !== undefined) {
      await this.authorizationCredentialsInput.fill(authorizationCredentials);
    }
    if (authorizationCredentialsFile !== undefined) {
      await this.authorizationCredentialsFileInput.fill(authorizationCredentialsFile);
    }
    if (basicAuthUsername !== undefined) {
      await this.basicAuthUsernameInput.fill(basicAuthUsername);
    }
    if (proxyUrl !== undefined) {
      await this.proxyUrlInput.fill(proxyUrl);
    }
    if (tlsServerName !== undefined) {
      await this.tlsServerNameInput.fill(tlsServerName);
    }
    if (tlsSkipVerify) {
      await this.tlsSkipVerifyCheckbox.click({ force: true });
    }
  }
}
