/**
 * Alertmanager Receiver Types
 * Based on: https://github.com/prometheus/alertmanager/blob/main/config/config.go
 */

// Base receiver type
export type BaseReceiver = {
  name: string;
};

// Individual receiver configuration types

export type EmailConfig = {
  to?: string;
  from?: string;
  smarthost?: string;
  auth_username?: string;
  auth_password?: string;
  auth_identity?: string;
  headers?: Record<string, string>;
  html?: string;
  text?: string;
  require_tls?: boolean;
};

export type SlackConfig = {
  api_url?: string;
  channel?: string;
  username?: string;
  color?: string;
  title?: string;
  title_link?: string;
  pretext?: string;
  text?: string;
  footer?: string;
  icon_emoji?: string;
  icon_url?: string;
  image_url?: string;
  thumb_url?: string;
};

export type PagerdutyConfig = {
  routing_key?: string;
  service_key?: string;
  url?: string;
  client?: string;
  client_url?: string;
  description?: string;
  severity?: string;
  details?: Record<string, string>;
};

export type WebhookConfig = {
  url?: string;
  max_alerts?: number;
};

export type OpsGenieConfig = {
  api_key?: string;
  api_url?: string;
  message?: string;
  description?: string;
  source?: string;
  details?: Record<string, string>;
  tags?: string;
  priority?: string;
};

export type WechatConfig = {
  api_url?: string;
  corp_id?: string;
  agent_id?: string;
  api_secret?: string;
  to_user?: string;
  to_party?: string;
  to_tag?: string;
  message?: string;
};

export type PushoverConfig = {
  user_key?: string;
  token?: string;
  title?: string;
  message?: string;
  url?: string;
  priority?: string;
  retry?: string;
  expire?: string;
};

export type VictorOpsConfig = {
  api_key?: string;
  api_url?: string;
  routing_key?: string;
  message_type?: string;
  entity_display_name?: string;
  state_message?: string;
  monitoring_tool?: string;
};

export type SNSConfig = {
  topic_arn?: string;
  phone_number?: string;
  target_arn?: string;
  subject?: string;
  message?: string;
  attributes?: Record<string, string>;
};

export type TelegramConfig = {
  api_url?: string;
  bot_token?: string;
  chat_id?: number;
  message?: string;
  disable_notifications?: boolean;
  parse_mode?: string;
};

export type DiscordConfig = {
  webhook_url?: string;
  title?: string;
  message?: string;
};

export type WebexConfig = {
  api_url?: string;
  room_id?: string;
  message?: string;
};

export type MSTeamsConfig = {
  webhook_url?: string;
  title?: string;
  text?: string;
};

// Receiver with typed configurations (discriminated union)
export type Receiver = BaseReceiver & {
  email_configs?: EmailConfig[];
  slack_configs?: SlackConfig[];
  pagerduty_configs?: PagerdutyConfig[];
  webhook_configs?: WebhookConfig[];
  opsgenie_configs?: OpsGenieConfig[];
  wechat_configs?: WechatConfig[];
  pushover_configs?: PushoverConfig[];
  victorops_configs?: VictorOpsConfig[];
  sns_configs?: SNSConfig[];
  telegram_configs?: TelegramConfig[];
  discord_configs?: DiscordConfig[];
  webex_configs?: WebexConfig[];
  msteams_configs?: MSTeamsConfig[];
};

// Type guard functions for receiver discrimination

export function hasEmailConfigs(receiver: Receiver): receiver is Receiver & { email_configs: EmailConfig[] } {
  return Array.isArray(receiver.email_configs) && receiver.email_configs.length > 0;
}

export function hasSlackConfigs(receiver: Receiver): receiver is Receiver & { slack_configs: SlackConfig[] } {
  return Array.isArray(receiver.slack_configs) && receiver.slack_configs.length > 0;
}

export function hasPagerdutyConfigs(
  receiver: Receiver
): receiver is Receiver & { pagerduty_configs: PagerdutyConfig[] } {
  return Array.isArray(receiver.pagerduty_configs) && receiver.pagerduty_configs.length > 0;
}

export function hasWebhookConfigs(receiver: Receiver): receiver is Receiver & { webhook_configs: WebhookConfig[] } {
  return Array.isArray(receiver.webhook_configs) && receiver.webhook_configs.length > 0;
}

export function hasOpsGenieConfigs(receiver: Receiver): receiver is Receiver & { opsgenie_configs: OpsGenieConfig[] } {
  return Array.isArray(receiver.opsgenie_configs) && receiver.opsgenie_configs.length > 0;
}

export function hasWechatConfigs(receiver: Receiver): receiver is Receiver & { wechat_configs: WechatConfig[] } {
  return Array.isArray(receiver.wechat_configs) && receiver.wechat_configs.length > 0;
}

export function hasPushoverConfigs(receiver: Receiver): receiver is Receiver & { pushover_configs: PushoverConfig[] } {
  return Array.isArray(receiver.pushover_configs) && receiver.pushover_configs.length > 0;
}

export function hasVictorOpsConfigs(
  receiver: Receiver
): receiver is Receiver & { victorops_configs: VictorOpsConfig[] } {
  return Array.isArray(receiver.victorops_configs) && receiver.victorops_configs.length > 0;
}

export function hasSNSConfigs(receiver: Receiver): receiver is Receiver & { sns_configs: SNSConfig[] } {
  return Array.isArray(receiver.sns_configs) && receiver.sns_configs.length > 0;
}

export function hasTelegramConfigs(receiver: Receiver): receiver is Receiver & { telegram_configs: TelegramConfig[] } {
  return Array.isArray(receiver.telegram_configs) && receiver.telegram_configs.length > 0;
}

export function hasDiscordConfigs(receiver: Receiver): receiver is Receiver & { discord_configs: DiscordConfig[] } {
  return Array.isArray(receiver.discord_configs) && receiver.discord_configs.length > 0;
}

export function hasWebexConfigs(receiver: Receiver): receiver is Receiver & { webex_configs: WebexConfig[] } {
  return Array.isArray(receiver.webex_configs) && receiver.webex_configs.length > 0;
}

export function hasMSTeamsConfigs(receiver: Receiver): receiver is Receiver & { msteams_configs: MSTeamsConfig[] } {
  return Array.isArray(receiver.msteams_configs) && receiver.msteams_configs.length > 0;
}

// Helper function to get all configured receiver types for a receiver
export function getReceiverTypes(receiver: Receiver): string[] {
  const types: string[] = [];
  if (hasEmailConfigs(receiver)) types.push('email');
  if (hasSlackConfigs(receiver)) types.push('slack');
  if (hasPagerdutyConfigs(receiver)) types.push('pagerduty');
  if (hasWebhookConfigs(receiver)) types.push('webhook');
  if (hasOpsGenieConfigs(receiver)) types.push('opsgenie');
  if (hasWechatConfigs(receiver)) types.push('wechat');
  if (hasPushoverConfigs(receiver)) types.push('pushover');
  if (hasVictorOpsConfigs(receiver)) types.push('victorops');
  if (hasSNSConfigs(receiver)) types.push('sns');
  if (hasTelegramConfigs(receiver)) types.push('telegram');
  if (hasDiscordConfigs(receiver)) types.push('discord');
  if (hasWebexConfigs(receiver)) types.push('webex');
  if (hasMSTeamsConfigs(receiver)) types.push('msteams');
  return types;
}
