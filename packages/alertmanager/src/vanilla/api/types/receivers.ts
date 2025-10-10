/**
 * Alertmanager Receiver Types
 * Based on: https://github.com/prometheus/alertmanager/blob/main/config/config.go
 */

import { z } from 'zod';

// Zod schemas for individual receiver configuration types

export const EmailConfigSchema = z.object({
  to: z.string().optional(),
  from: z.string().optional(),
  smarthost: z.string().optional(),
  auth_username: z.string().optional(),
  auth_password: z.string().optional(),
  auth_identity: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  require_tls: z.boolean().optional(),
});

export const SlackConfigSchema = z.object({
  api_url: z.string().optional(),
  channel: z.string().optional(),
  username: z.string().optional(),
  color: z.string().optional(),
  title: z.string().optional(),
  title_link: z.string().optional(),
  pretext: z.string().optional(),
  text: z.string().optional(),
  footer: z.string().optional(),
  icon_emoji: z.string().optional(),
  icon_url: z.string().optional(),
  image_url: z.string().optional(),
  thumb_url: z.string().optional(),
});

export const PagerdutyConfigSchema = z.object({
  routing_key: z.string().optional(),
  service_key: z.string().optional(),
  url: z.string().optional(),
  client: z.string().optional(),
  client_url: z.string().optional(),
  description: z.string().optional(),
  severity: z.string().optional(),
  details: z.record(z.string(), z.string()).optional(),
});

export const WebhookConfigSchema = z.object({
  url: z.string().optional(),
  max_alerts: z.number().optional(),
});

export const OpsGenieConfigSchema = z.object({
  api_key: z.string().optional(),
  api_url: z.string().optional(),
  message: z.string().optional(),
  description: z.string().optional(),
  source: z.string().optional(),
  details: z.record(z.string(), z.string()).optional(),
  tags: z.string().optional(),
  priority: z.string().optional(),
});

export const WechatConfigSchema = z.object({
  api_url: z.string().optional(),
  corp_id: z.string().optional(),
  agent_id: z.string().optional(),
  api_secret: z.string().optional(),
  to_user: z.string().optional(),
  to_party: z.string().optional(),
  to_tag: z.string().optional(),
  message: z.string().optional(),
});

export const PushoverConfigSchema = z.object({
  user_key: z.string().optional(),
  token: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  url: z.string().optional(),
  priority: z.string().optional(),
  retry: z.string().optional(),
  expire: z.string().optional(),
});

export const VictorOpsConfigSchema = z.object({
  api_key: z.string().optional(),
  api_url: z.string().optional(),
  routing_key: z.string().optional(),
  message_type: z.string().optional(),
  entity_display_name: z.string().optional(),
  state_message: z.string().optional(),
  monitoring_tool: z.string().optional(),
});

export const SNSConfigSchema = z.object({
  topic_arn: z.string().optional(),
  phone_number: z.string().optional(),
  target_arn: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
});

export const TelegramConfigSchema = z.object({
  api_url: z.string().optional(),
  bot_token: z.string().optional(),
  chat_id: z.number().optional(),
  message: z.string().optional(),
  disable_notifications: z.boolean().optional(),
  parse_mode: z.string().optional(),
});

export const DiscordConfigSchema = z.object({
  webhook_url: z.string().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
});

export const WebexConfigSchema = z.object({
  api_url: z.string().optional(),
  room_id: z.string().optional(),
  message: z.string().optional(),
});

export const MSTeamsConfigSchema = z.object({
  webhook_url: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
});

// Receiver schema
export const ReceiverSchema = z.object({
  name: z.string(),
  email_configs: z.array(EmailConfigSchema).optional(),
  slack_configs: z.array(SlackConfigSchema).optional(),
  pagerduty_configs: z.array(PagerdutyConfigSchema).optional(),
  webhook_configs: z.array(WebhookConfigSchema).optional(),
  opsgenie_configs: z.array(OpsGenieConfigSchema).optional(),
  wechat_configs: z.array(WechatConfigSchema).optional(),
  pushover_configs: z.array(PushoverConfigSchema).optional(),
  victorops_configs: z.array(VictorOpsConfigSchema).optional(),
  sns_configs: z.array(SNSConfigSchema).optional(),
  telegram_configs: z.array(TelegramConfigSchema).optional(),
  discord_configs: z.array(DiscordConfigSchema).optional(),
  webex_configs: z.array(WebexConfigSchema).optional(),
  msteams_configs: z.array(MSTeamsConfigSchema).optional(),
});

// Export inferred types
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export type PagerdutyConfig = z.infer<typeof PagerdutyConfigSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type OpsGenieConfig = z.infer<typeof OpsGenieConfigSchema>;
export type WechatConfig = z.infer<typeof WechatConfigSchema>;
export type PushoverConfig = z.infer<typeof PushoverConfigSchema>;
export type VictorOpsConfig = z.infer<typeof VictorOpsConfigSchema>;
export type SNSConfig = z.infer<typeof SNSConfigSchema>;
export type TelegramConfig = z.infer<typeof TelegramConfigSchema>;
export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;
export type WebexConfig = z.infer<typeof WebexConfigSchema>;
export type MSTeamsConfig = z.infer<typeof MSTeamsConfigSchema>;
export type Receiver = z.infer<typeof ReceiverSchema>;

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
