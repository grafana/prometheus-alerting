import { Locator, Page } from '@playwright/test';

export interface TelegramFormParams {
  apiUrl?: string;
  botToken?: string;
  chatId?: string;
  message?: string;
  disableNotifications?: boolean;
  parseMode?: 'None' | 'MarkdownV2' | 'Markdown' | 'HTML';
}

export class TelegramIntegrationForm {
  readonly apiUrlInput: Locator;
  readonly botTokenInput: Locator;
  readonly chatIdInput: Locator;
  readonly messageInput: Locator;
  readonly disableNotificationsCheckbox: Locator;
  readonly parseModeCombobox: Locator;

  constructor(
    private readonly page: Page,
    scope: Locator
  ) {
    this.apiUrlInput = scope.getByLabel('API URL', { exact: true });
    this.botTokenInput = scope.getByLabel('Bot token', { exact: true });
    this.chatIdInput = scope.getByLabel('Chat ID', { exact: true });
    this.messageInput = scope.getByLabel('Message', { exact: true });
    this.disableNotificationsCheckbox = scope.getByLabel('Disable notifications', { exact: true });
    this.parseModeCombobox = scope.getByRole('combobox', { name: 'Parse mode' });
  }

  async fill({ apiUrl, botToken, chatId, message, disableNotifications, parseMode }: TelegramFormParams) {
    if (apiUrl !== undefined) await this.apiUrlInput.fill(apiUrl);
    if (botToken !== undefined) await this.botTokenInput.fill(botToken);
    if (chatId !== undefined) await this.chatIdInput.fill(chatId);
    if (message !== undefined) await this.messageInput.fill(message);
    if (disableNotifications !== undefined) {
      await this.disableNotificationsCheckbox.setChecked(disableNotifications, { force: true });
    }
    if (parseMode !== undefined) {
      await this.parseModeCombobox.click();
      await this.page.getByRole('option', { name: parseMode, exact: true }).click();
    }
  }
}
