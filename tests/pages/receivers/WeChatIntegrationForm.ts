import { Locator, Page } from '@playwright/test';

export interface WeChatFormParams {
  apiUrl?: string;
  apiSecret?: string;
  corpId?: string;
  agentId?: string;
  toUser?: string;
  toParty?: string;
  toTag?: string;
  message?: string;
  messageType?: 'Text' | 'Markdown';
}

export class WeChatIntegrationForm {
  readonly apiUrlInput: Locator;
  readonly apiSecretInput: Locator;
  readonly corpIdInput: Locator;
  readonly agentIdInput: Locator;
  readonly toUserInput: Locator;
  readonly toPartyInput: Locator;
  readonly toTagInput: Locator;
  readonly messageInput: Locator;
  readonly messageTypeCombobox: Locator;

  constructor(
    private readonly page: Page,
    scope: Locator
  ) {
    this.apiUrlInput = scope.getByLabel('API URL', { exact: true });
    this.apiSecretInput = scope.getByLabel('API secret', { exact: true });
    this.corpIdInput = scope.getByLabel('Corp ID', { exact: true });
    this.agentIdInput = scope.getByLabel('Agent ID', { exact: true });
    this.toUserInput = scope.getByLabel('To user', { exact: true });
    this.toPartyInput = scope.getByLabel('To party', { exact: true });
    this.toTagInput = scope.getByLabel('To tag', { exact: true });
    this.messageInput = scope.getByLabel('Message', { exact: true });
    this.messageTypeCombobox = scope.getByRole('combobox', { name: 'Message type' });
  }

  async fill(params: WeChatFormParams) {
    const fields: Array<[keyof WeChatFormParams, Locator]> = [
      ['apiUrl', this.apiUrlInput],
      ['apiSecret', this.apiSecretInput],
      ['corpId', this.corpIdInput],
      ['agentId', this.agentIdInput],
      ['toUser', this.toUserInput],
      ['toParty', this.toPartyInput],
      ['toTag', this.toTagInput],
      ['message', this.messageInput],
    ];
    for (const [key, input] of fields) {
      const value = params[key];
      if (value !== undefined) await input.fill(value);
    }
    if (params.messageType !== undefined) {
      await this.messageTypeCombobox.click();
      await this.page.getByRole('option', { name: params.messageType, exact: true }).click();
    }
  }
}
