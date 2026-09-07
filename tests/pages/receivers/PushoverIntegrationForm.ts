import { Locator } from '@playwright/test';

export interface PushoverFormParams {
  userKey?: string;
  token?: string;
  title?: string;
  message?: string;
  url?: string;
  urlTitle?: string;
  device?: string;
  sound?: string;
  priority?: string;
  retry?: string;
  expire?: string;
  ttl?: string;
  enableHtml?: boolean;
}

export class PushoverIntegrationForm {
  readonly userKeyInput: Locator;
  readonly tokenInput: Locator;
  readonly titleInput: Locator;
  readonly messageInput: Locator;
  readonly urlInput: Locator;
  readonly urlTitleInput: Locator;
  readonly deviceInput: Locator;
  readonly soundInput: Locator;
  readonly priorityInput: Locator;
  readonly retryInput: Locator;
  readonly expireInput: Locator;
  readonly ttlInput: Locator;
  readonly enableHtmlCheckbox: Locator;

  constructor(scope: Locator) {
    this.userKeyInput = scope.getByLabel('User key', { exact: true });
    this.tokenInput = scope.getByLabel('Token', { exact: true });
    this.titleInput = scope.getByLabel('Title', { exact: true });
    this.messageInput = scope.getByLabel('Message', { exact: true });
    this.urlInput = scope.getByLabel('URL', { exact: true });
    this.urlTitleInput = scope.getByLabel('URL title', { exact: true });
    this.deviceInput = scope.getByLabel('Device', { exact: true });
    this.soundInput = scope.getByLabel('Sound', { exact: true });
    this.priorityInput = scope.getByLabel('Priority', { exact: true });
    this.retryInput = scope.getByLabel('Retry', { exact: true });
    this.expireInput = scope.getByLabel('Expire', { exact: true });
    this.ttlInput = scope.getByLabel('TTL', { exact: true });
    this.enableHtmlCheckbox = scope.getByLabel('Enable HTML', { exact: true });
  }

  async fill(params: PushoverFormParams) {
    const fields: Array<[keyof PushoverFormParams, Locator]> = [
      ['userKey', this.userKeyInput],
      ['token', this.tokenInput],
      ['title', this.titleInput],
      ['message', this.messageInput],
      ['url', this.urlInput],
      ['urlTitle', this.urlTitleInput],
      ['device', this.deviceInput],
      ['sound', this.soundInput],
      ['priority', this.priorityInput],
      ['retry', this.retryInput],
      ['expire', this.expireInput],
      ['ttl', this.ttlInput],
    ];
    for (const [key, input] of fields) {
      const value = params[key];
      if (typeof value === 'string') await input.fill(value);
    }
    if (params.enableHtml !== undefined) await this.enableHtmlCheckbox.setChecked(params.enableHtml, { force: true });
  }
}
