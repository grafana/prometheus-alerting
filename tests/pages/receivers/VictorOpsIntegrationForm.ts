import { Locator } from '@playwright/test';

export interface VictorOpsFormParams {
  apiKey?: string;
  apiUrl?: string;
  routingKey?: string;
  messageType?: string;
  entityDisplayName?: string;
  stateMessage?: string;
  monitoringTool?: string;
}

export class VictorOpsIntegrationForm {
  readonly apiKeyInput: Locator;
  readonly apiUrlInput: Locator;
  readonly routingKeyInput: Locator;
  readonly messageTypeInput: Locator;
  readonly entityDisplayNameInput: Locator;
  readonly stateMessageInput: Locator;
  readonly monitoringToolInput: Locator;

  constructor(scope: Locator) {
    this.apiKeyInput = scope.getByLabel('API key', { exact: true });
    this.apiUrlInput = scope.getByLabel('API URL', { exact: true });
    this.routingKeyInput = scope.getByLabel('Routing key', { exact: true });
    this.messageTypeInput = scope.getByLabel('Message type', { exact: true });
    this.entityDisplayNameInput = scope.getByLabel('Entity display name', { exact: true });
    this.stateMessageInput = scope.getByLabel('State message', { exact: true });
    this.monitoringToolInput = scope.getByLabel('Monitoring tool', { exact: true });
  }

  async fill({
    apiKey,
    apiUrl,
    routingKey,
    messageType,
    entityDisplayName,
    stateMessage,
    monitoringTool,
  }: VictorOpsFormParams) {
    if (apiKey !== undefined) await this.apiKeyInput.fill(apiKey);
    if (apiUrl !== undefined) await this.apiUrlInput.fill(apiUrl);
    if (routingKey !== undefined) await this.routingKeyInput.fill(routingKey);
    if (messageType !== undefined) await this.messageTypeInput.fill(messageType);
    if (entityDisplayName !== undefined) await this.entityDisplayNameInput.fill(entityDisplayName);
    if (stateMessage !== undefined) await this.stateMessageInput.fill(stateMessage);
    if (monitoringTool !== undefined) await this.monitoringToolInput.fill(monitoringTool);
  }
}
