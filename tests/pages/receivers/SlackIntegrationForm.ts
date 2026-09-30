import { Locator } from '@playwright/test';

export interface SlackFormParams {
  apiUrl?: string;
  channel?: string;
  iconEmoji?: string;
  iconUrl?: string;
  username?: string;
  title?: string;
  text?: string;
  authorizationCredentials?: string;
  basicAuthUsername?: string;
  proxyUrl?: string;
  proxyFromEnvironment?: boolean;
}

/**
 * Sub-page-object for a Slack integration's fields within the receiver drawer's create/edit form.
 * Scoped to the whole drawer, not a specific integration index — safe as long as a form has at
 * most one Slack integration. Obtained via `ReceiversPage.selectSlackIntegration`.
 *
 * `http_config` (proxy URL, basic auth, TLS) is deliberately not exposed here: it's the same
 * shared shape already exercised end-to-end by `WebhookIntegrationForm`. It does mean Slack's own
 * top-level `username` field shares the "Username" label with the always-rendered (whether filled
 * or not) `http_config.basic_auth.username` input — `usernameInput` below picks the first match,
 * which is the top-level field since `http_config`'s subform renders last.
 */
export class SlackIntegrationForm {
  readonly apiUrlInput: Locator;
  readonly channelInput: Locator;
  readonly iconEmojiInput: Locator;
  readonly iconUrlInput: Locator;
  readonly usernameInput: Locator;
  readonly titleInput: Locator;
  readonly textInput: Locator;
  readonly authorizationCredentialsInput: Locator;
  readonly basicAuthUsernameInput: Locator;
  readonly proxyUrlInput: Locator;
  readonly proxyFromEnvironmentCheckbox: Locator;

  constructor(scope: Locator) {
    this.apiUrlInput = scope.getByLabel('Webhook URL', { exact: true });
    this.channelInput = scope.getByLabel('Channel', { exact: true });
    this.iconEmojiInput = scope.getByLabel('Emoji icon', { exact: true });
    this.iconUrlInput = scope.getByLabel('Icon URL', { exact: true });
    this.usernameInput = scope.getByLabel('Username', { exact: true }).first();
    this.titleInput = scope.getByLabel('Title', { exact: true });
    this.textInput = scope.getByLabel('Message body', { exact: true });
    this.authorizationCredentialsInput = scope.getByLabel('Authorization credentials', { exact: true });
    this.basicAuthUsernameInput = scope.getByLabel('Basic authentication username', { exact: true });
    this.proxyUrlInput = scope.getByLabel('Proxy URL', { exact: true });
    this.proxyFromEnvironmentCheckbox = scope.getByLabel('Proxy from environment', { exact: true });
  }

  /** Fill any subset of the Slack integration's fields. */
  async fill({
    apiUrl,
    channel,
    iconEmoji,
    iconUrl,
    username,
    title,
    text,
    authorizationCredentials,
    basicAuthUsername,
    proxyUrl,
    proxyFromEnvironment,
  }: SlackFormParams) {
    if (apiUrl !== undefined) {
      await this.apiUrlInput.fill(apiUrl);
    }
    if (channel !== undefined) {
      await this.channelInput.fill(channel);
    }
    if (iconEmoji !== undefined) {
      await this.iconEmojiInput.fill(iconEmoji);
    }
    if (iconUrl !== undefined) {
      await this.iconUrlInput.fill(iconUrl);
    }
    if (username !== undefined) {
      await this.usernameInput.fill(username);
    }
    if (title !== undefined) {
      await this.titleInput.fill(title);
    }
    if (text !== undefined) {
      await this.textInput.fill(text);
    }
    if (authorizationCredentials !== undefined) {
      await this.authorizationCredentialsInput.fill(authorizationCredentials);
    }
    if (basicAuthUsername !== undefined) {
      await this.basicAuthUsernameInput.fill(basicAuthUsername);
    }
    if (proxyUrl !== undefined) {
      await this.proxyUrlInput.fill(proxyUrl);
    }
    if (proxyFromEnvironment !== undefined) {
      await this.proxyFromEnvironmentCheckbox.setChecked(proxyFromEnvironment, { force: true });
    }
  }
}
