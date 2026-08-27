/**
 * Alertmanager Receiver Types
 * Based on: https://github.com/prometheus/alertmanager/blob/main/config/config.go
 */

import { z } from 'zod';

// HTTP Config schemas (reusable across all receiver types)
// Based on: https://prometheus.io/docs/alerting/0.22/configuration/#http_config

export const TLSConfigSchema = z.looseObject({
  ca: z.string().optional(),
  cert: z.string().optional(),
  key: z.string().optional(),
  ca_file: z.string().optional(),
  cert_file: z.string().optional(),
  key_file: z.string().optional(),
  server_name: z.string().optional(),
  insecure_skip_verify: z.boolean().optional(),
  min_version: z.string().optional(),
  max_version: z.string().optional(),
});

export const BasicAuthConfigSchema = z
  .looseObject({
    username: z.string().optional(),
    password: z.string().optional(),
    password_file: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password && data.password_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'password and password_file are mutually exclusive',
        path: ['password'],
      });
    }
  });

export const AuthorizationConfigSchema = z
  .looseObject({
    type: z.string().optional(),
    credentials: z.string().optional(),
    credentials_file: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.credentials && data.credentials_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'credentials and credentials_file are mutually exclusive',
        path: ['credentials'],
      });
    }
  });

export const OAuth2ConfigSchema = z
  .looseObject({
    client_id: z.string(),
    client_secret: z.string().optional(),
    client_secret_file: z.string().optional(),
    scopes: z.array(z.string()).optional(),
    token_url: z.string(),
    endpoint_params: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.client_secret && data.client_secret_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'client_secret and client_secret_file are mutually exclusive',
        path: ['client_secret'],
      });
    }
  });

export const HTTPConfigSchema = z
  .looseObject({
    basic_auth: BasicAuthConfigSchema.optional(),
    authorization: AuthorizationConfigSchema.optional(),
    bearer_token: z.string().optional(),
    bearer_token_file: z.string().optional(),
    oauth2: OAuth2ConfigSchema.optional(),
    proxy_url: z.string().optional(),
    no_proxy: z.string().optional(),
    proxy_from_environment: z.boolean().optional(),
    proxy_connect_header: z.record(z.string(), z.array(z.string())).optional(),
    follow_redirects: z.boolean().optional(),
    enable_http2: z.boolean().optional(),
    http_headers: z.record(z.string(), z.unknown()).optional(),
    tls_config: TLSConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasBearerToken = [data.bearer_token, data.bearer_token_file].some(
      (credential) => credential !== undefined && credential !== ''
    );
    const authMethods = [data.basic_auth, data.authorization, data.oauth2, hasBearerToken].filter(Boolean);
    if (authMethods.length > 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'basic_auth, authorization, bearer_token, and oauth2 are mutually exclusive',
        path: ['basic_auth'],
      });
    }
    if (
      data.bearer_token !== undefined &&
      data.bearer_token !== '' &&
      data.bearer_token_file !== undefined &&
      data.bearer_token_file !== ''
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'bearer_token and bearer_token_file are mutually exclusive',
        path: ['bearer_token'],
      });
    }
  });

// Zod schemas for individual receiver configuration types

export const EmailConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    to: z.string().optional(),
    from: z.string().optional(),
    smarthost: z.string().optional(),
    hello: z.string().optional(),
    auth_username: z.string().optional(),
    auth_password: z.string().optional(),
    auth_password_file: z.string().optional(),
    auth_secret: z.string().optional(),
    auth_identity: z.string().optional(),
    headers: z.record(z.string(), z.string()).optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    require_tls: z.boolean().optional(),
    tls_config: TLSConfigSchema.optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.auth_password && data.auth_password_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'auth_password and auth_password_file are mutually exclusive',
        path: ['auth_password'],
      });
    }
  });

export const SlackFieldConfigSchema = z.looseObject({
  title: z.string().optional(),
  value: z.string().optional(),
  short: z.boolean().optional(),
});

export const SlackActionConfigSchema = z.looseObject({
  type: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  style: z.string().optional(),
  name: z.string().optional(),
  value: z.string().optional(),
  confirm: z
    .looseObject({
      title: z.string().optional(),
      text: z.string().optional(),
      ok_text: z.string().optional(),
      dismiss_text: z.string().optional(),
    })
    .optional(),
});

export const SlackConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    api_url: z.string().optional(),
    api_url_file: z.string().optional(),
    channel: z.string().optional(),
    username: z.string().optional(),
    color: z.string().optional(),
    title: z.string().optional(),
    title_link: z.string().optional(),
    pretext: z.string().optional(),
    text: z.string().optional(),
    fields: z.array(SlackFieldConfigSchema).optional(),
    short_fields: z.boolean().optional(),
    footer: z.string().optional(),
    fallback: z.string().optional(),
    callback_id: z.string().optional(),
    icon_emoji: z.string().optional(),
    icon_url: z.string().optional(),
    image_url: z.string().optional(),
    thumb_url: z.string().optional(),
    link_names: z.boolean().optional(),
    mrkdwn_in: z.array(z.string()).optional(),
    actions: z.array(SlackActionConfigSchema).optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.api_url && data.api_url_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'api_url and api_url_file are mutually exclusive',
        path: ['api_url'],
      });
    }
  });

export const PagerdutyLinkConfigSchema = z.looseObject({
  href: z.string().optional(),
  text: z.string().optional(),
});

export const PagerdutyImageConfigSchema = z.looseObject({
  src: z.string().optional(),
  href: z.string().optional(),
  alt: z.string().optional(),
});

export const PagerdutyConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    routing_key: z.string().optional(),
    routing_key_file: z.string().optional(),
    service_key: z.string().optional(),
    service_key_file: z.string().optional(),
    url: z.string().optional(),
    client: z.string().optional(),
    client_url: z.string().optional(),
    description: z.string().optional(),
    severity: z.string().optional(),
    class: z.string().optional(),
    component: z.string().optional(),
    group: z.string().optional(),
    source: z.string().optional(),
    details: z.record(z.string(), z.string()).optional(),
    images: z.array(PagerdutyImageConfigSchema).optional(),
    links: z.array(PagerdutyLinkConfigSchema).optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.routing_key && data.routing_key_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'routing_key and routing_key_file are mutually exclusive',
        path: ['routing_key'],
      });
    }
    if (data.service_key && data.service_key_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'service_key and service_key_file are mutually exclusive',
        path: ['service_key'],
      });
    }
  });

export const WebhookConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    url: z.string().optional(),
    url_file: z.string().optional(),
    max_alerts: z.number().optional(),
    timeout: z.string().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.url && data.url_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'url and url_file are mutually exclusive',
        path: ['url'],
      });
    }
  });

export const OpsGenieResponderConfigSchema = z.looseObject({
  id: z.string().optional(),
  name: z.string().optional(),
  username: z.string().optional(),
  type: z.string().optional(),
});

export const OpsGenieConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    api_key: z.string().optional(),
    api_key_file: z.string().optional(),
    api_url: z.string().optional(),
    message: z.string().optional(),
    description: z.string().optional(),
    source: z.string().optional(),
    details: z.record(z.string(), z.string()).optional(),
    responders: z.array(OpsGenieResponderConfigSchema).optional(),
    tags: z.string().optional(),
    note: z.string().optional(),
    priority: z.string().optional(),
    entity: z.string().optional(),
    actions: z.string().optional(),
    update_alerts: z.boolean().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.api_key && data.api_key_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'api_key and api_key_file are mutually exclusive',
        path: ['api_key'],
      });
    }
  });

export const WechatConfigSchema = z.looseObject({
  send_resolved: z.boolean().optional(),
  api_url: z.string().optional(),
  corp_id: z.string().optional(),
  agent_id: z.string().optional(),
  api_secret: z.string().optional(),
  to_user: z.string().optional(),
  to_party: z.string().optional(),
  to_tag: z.string().optional(),
  message: z.string().optional(),
  message_type: z.string().optional(),
  http_config: HTTPConfigSchema.optional(),
});

export const PushoverConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    user_key: z.string().optional(),
    user_key_file: z.string().optional(),
    token: z.string().optional(),
    token_file: z.string().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    url: z.string().optional(),
    url_title: z.string().optional(),
    device: z.string().optional(),
    sound: z.string().optional(),
    priority: z.string().optional(),
    retry: z.string().optional(),
    expire: z.string().optional(),
    ttl: z.string().optional(),
    html: z.boolean().optional(),
    monospace: z.boolean().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.user_key && data.user_key_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'user_key and user_key_file are mutually exclusive',
        path: ['user_key'],
      });
    }
    if (data.token && data.token_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'token and token_file are mutually exclusive',
        path: ['token'],
      });
    }
  });

export const VictorOpsConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    api_key: z.string().optional(),
    api_key_file: z.string().optional(),
    api_url: z.string().optional(),
    routing_key: z.string().optional(),
    message_type: z.string().optional(),
    entity_display_name: z.string().optional(),
    state_message: z.string().optional(),
    monitoring_tool: z.string().optional(),
    custom_fields: z.record(z.string(), z.string()).optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.api_key && data.api_key_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'api_key and api_key_file are mutually exclusive',
        path: ['api_key'],
      });
    }
  });

export const SigV4ConfigSchema = z
  .looseObject({
    region: z.string().optional(),
    access_key: z.string().optional(),
    secret_key: z.string().optional(),
    profile: z.string().optional(),
    role_arn: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasAccessKey = !!data.access_key;
    const hasSecretKey = !!data.secret_key;
    if (hasAccessKey !== hasSecretKey) {
      ctx.addIssue({
        code: 'custom',
        message: 'access_key and secret_key must both be supplied or both be blank',
        path: ['access_key'],
      });
    }
  });

export const SNSConfigSchema = z.looseObject({
  send_resolved: z.boolean().optional(),
  api_url: z.string().optional(),
  sigv4: SigV4ConfigSchema.optional(),
  topic_arn: z.string().optional(),
  phone_number: z.string().optional(),
  target_arn: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  http_config: HTTPConfigSchema.optional(),
});

export const TelegramConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    api_url: z.string().optional(),
    bot_token: z.string().optional(),
    bot_token_file: z.string().optional(),
    chat_id: z.number().optional(),
    message_thread_id: z.number().optional(),
    message: z.string().optional(),
    disable_notifications: z.boolean().optional(),
    parse_mode: z.string().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.bot_token && data.bot_token_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'bot_token and bot_token_file are mutually exclusive',
        path: ['bot_token'],
      });
    }
  });

export const DiscordConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    webhook_url: z.string().optional(),
    webhook_url_file: z.string().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    content: z.string().optional(),
    username: z.string().optional(),
    avatar_url: z.string().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.webhook_url && data.webhook_url_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'webhook_url and webhook_url_file are mutually exclusive',
        path: ['webhook_url'],
      });
    }
  });

export const WebexConfigSchema = z.looseObject({
  send_resolved: z.boolean().optional(),
  api_url: z.string().optional(),
  room_id: z.string().optional(),
  message: z.string().optional(),
  http_config: HTTPConfigSchema.optional(),
});

export const MSTeamsConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    webhook_url: z.string().optional(),
    webhook_url_file: z.string().optional(),
    title: z.string().optional(),
    summary: z.string().optional(),
    text: z.string().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.webhook_url && data.webhook_url_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'webhook_url and webhook_url_file are mutually exclusive',
        path: ['webhook_url'],
      });
    }
  });

export const MSTeamsV2ConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    webhook_url: z.string().optional(),
    webhook_url_file: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.webhook_url && data.webhook_url_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'webhook_url and webhook_url_file are mutually exclusive',
        path: ['webhook_url'],
      });
    }
  });

export const JiraConfigSchema = z.looseObject({
  send_resolved: z.boolean().optional(),
  api_url: z.string().optional(),
  api_type: z.string().optional(),
  project: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  labels: z.array(z.string()).optional(),
  priority: z.string().optional(),
  issue_type: z.string().optional(),
  resolve_transition: z.string().optional(),
  reopen_transition: z.string().optional(),
  wont_fix_resolution: z.string().optional(),
  reopen_duration: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
  http_config: HTTPConfigSchema.optional(),
});

export const RocketchatFieldConfigSchema = z.looseObject({
  title: z.string().optional(),
  value: z.string().optional(),
  short: z.boolean().optional(),
});

export const RocketchatActionConfigSchema = z.looseObject({
  type: z.string().optional(),
  text: z.string().optional(),
  url: z.string().optional(),
  msg: z.string().optional(),
  msg_in_chat_window: z.boolean().optional(),
});

export const RocketchatConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    api_url: z.string().optional(),
    channel: z.string().optional(),
    token: z.string().optional(),
    token_file: z.string().optional(),
    token_id: z.string().optional(),
    token_id_file: z.string().optional(),
    color: z.string().optional(),
    emoji: z.string().optional(),
    icon_url: z.string().optional(),
    text: z.string().optional(),
    title: z.string().optional(),
    title_link: z.string().optional(),
    image_url: z.string().optional(),
    thumb_url: z.string().optional(),
    link_names: z.string().optional(),
    short_fields: z.boolean().optional(),
    fields: z.array(RocketchatFieldConfigSchema).optional(),
    actions: z.array(RocketchatActionConfigSchema).optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.token && data.token_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'token and token_file are mutually exclusive',
        path: ['token'],
      });
    }
    if (data.token_id && data.token_id_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'token_id and token_id_file are mutually exclusive',
        path: ['token_id'],
      });
    }
  });

export const MattermostConfigSchema = z.looseObject({
  send_resolved: z.boolean().optional(),
});

export const IncidentioConfigSchema = z
  .looseObject({
    send_resolved: z.boolean().optional(),
    url: z.string().optional(),
    url_file: z.string().optional(),
    alert_source_token: z.string().optional(),
    alert_source_token_file: z.string().optional(),
    max_alerts: z.number().optional(),
    timeout: z.string().optional(),
    http_config: HTTPConfigSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.url && data.url_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'url and url_file are mutually exclusive',
        path: ['url'],
      });
    }
    if (data.alert_source_token && data.alert_source_token_file) {
      ctx.addIssue({
        code: 'custom',
        message: 'alert_source_token and alert_source_token_file are mutually exclusive',
        path: ['alert_source_token'],
      });
    }
  });

// Receiver schema
export const ReceiverSchema = z.looseObject({
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
  msteamsv2_configs: z.array(MSTeamsV2ConfigSchema).optional(),
  jira_configs: z.array(JiraConfigSchema).optional(),
  rocketchat_configs: z.array(RocketchatConfigSchema).optional(),
  incidentio_configs: z.array(IncidentioConfigSchema).optional(),
  mattermost_configs: z.array(MattermostConfigSchema).optional(),
});

// Export inferred types
export type TLSConfig = z.infer<typeof TLSConfigSchema>;
export type BasicAuthConfig = z.infer<typeof BasicAuthConfigSchema>;
export type AuthorizationConfig = z.infer<typeof AuthorizationConfigSchema>;
export type OAuth2Config = z.infer<typeof OAuth2ConfigSchema>;
export type HTTPConfig = z.infer<typeof HTTPConfigSchema>;
export type EmailConfig = z.infer<typeof EmailConfigSchema>;
export type SlackFieldConfig = z.infer<typeof SlackFieldConfigSchema>;
export type SlackActionConfig = z.infer<typeof SlackActionConfigSchema>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export type PagerdutyLinkConfig = z.infer<typeof PagerdutyLinkConfigSchema>;
export type PagerdutyImageConfig = z.infer<typeof PagerdutyImageConfigSchema>;
export type PagerdutyConfig = z.infer<typeof PagerdutyConfigSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;
export type OpsGenieResponderConfig = z.infer<typeof OpsGenieResponderConfigSchema>;
export type OpsGenieConfig = z.infer<typeof OpsGenieConfigSchema>;
export type WechatConfig = z.infer<typeof WechatConfigSchema>;
export type PushoverConfig = z.infer<typeof PushoverConfigSchema>;
export type VictorOpsConfig = z.infer<typeof VictorOpsConfigSchema>;
export type SigV4Config = z.infer<typeof SigV4ConfigSchema>;
export type SNSConfig = z.infer<typeof SNSConfigSchema>;
export type TelegramConfig = z.infer<typeof TelegramConfigSchema>;
export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;
export type WebexConfig = z.infer<typeof WebexConfigSchema>;
export type MSTeamsConfig = z.infer<typeof MSTeamsConfigSchema>;
export type MSTeamsV2Config = z.infer<typeof MSTeamsV2ConfigSchema>;
export type JiraConfig = z.infer<typeof JiraConfigSchema>;
export type RocketchatFieldConfig = z.infer<typeof RocketchatFieldConfigSchema>;
export type RocketchatActionConfig = z.infer<typeof RocketchatActionConfigSchema>;
export type RocketchatConfig = z.infer<typeof RocketchatConfigSchema>;
export type IncidentioConfig = z.infer<typeof IncidentioConfigSchema>;
export type MattermostConfig = z.infer<typeof MattermostConfigSchema>;
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

export function hasMSTeamsV2Configs(
  receiver: Receiver
): receiver is Receiver & { msteamsv2_configs: MSTeamsV2Config[] } {
  return Array.isArray(receiver.msteamsv2_configs) && receiver.msteamsv2_configs.length > 0;
}

export function hasJiraConfigs(receiver: Receiver): receiver is Receiver & { jira_configs: JiraConfig[] } {
  return Array.isArray(receiver.jira_configs) && receiver.jira_configs.length > 0;
}

export function hasRocketchatConfigs(
  receiver: Receiver
): receiver is Receiver & { rocketchat_configs: RocketchatConfig[] } {
  return Array.isArray(receiver.rocketchat_configs) && receiver.rocketchat_configs.length > 0;
}

export function hasIncidentioConfigs(
  receiver: Receiver
): receiver is Receiver & { incidentio_configs: IncidentioConfig[] } {
  return Array.isArray(receiver.incidentio_configs) && receiver.incidentio_configs.length > 0;
}

export function hasMattermostConfigs(
  receiver: Receiver
): receiver is Receiver & { mattermost_configs: MattermostConfig[] } {
  return Array.isArray(receiver.mattermost_configs) && receiver.mattermost_configs.length > 0;
}

// Helper function to get all configured receiver types for a receiver
export function getReceiverTypes(receiver: Receiver): string[] {
  const types: string[] = [];
  if (hasEmailConfigs(receiver)) {
    types.push('email');
  }
  if (hasSlackConfigs(receiver)) {
    types.push('slack');
  }
  if (hasPagerdutyConfigs(receiver)) {
    types.push('pagerduty');
  }
  if (hasWebhookConfigs(receiver)) {
    types.push('webhook');
  }
  if (hasOpsGenieConfigs(receiver)) {
    types.push('opsgenie');
  }
  if (hasWechatConfigs(receiver)) {
    types.push('wechat');
  }
  if (hasPushoverConfigs(receiver)) {
    types.push('pushover');
  }
  if (hasVictorOpsConfigs(receiver)) {
    types.push('victorops');
  }
  if (hasSNSConfigs(receiver)) {
    types.push('sns');
  }
  if (hasTelegramConfigs(receiver)) {
    types.push('telegram');
  }
  if (hasDiscordConfigs(receiver)) {
    types.push('discord');
  }
  if (hasWebexConfigs(receiver)) {
    types.push('webex');
  }
  if (hasMSTeamsConfigs(receiver)) {
    types.push('msteams');
  }
  if (hasMSTeamsV2Configs(receiver)) {
    types.push('msteamsv2');
  }
  if (hasJiraConfigs(receiver)) {
    types.push('jira');
  }
  if (hasRocketchatConfigs(receiver)) {
    types.push('rocketchat');
  }
  if (hasIncidentioConfigs(receiver)) {
    types.push('incidentio');
  }
  if (hasMattermostConfigs(receiver)) {
    types.push('mattermost');
  }
  return types;
}
