import { z } from 'zod';
import { HTTPConfigSchema, ReceiverSchema, TLSConfigSchema } from './receivers';

// Re-export receiver types for convenience
export type { Receiver } from './receivers';
export { ReceiverSchema } from './receivers';

// Zod schemas for common types

export const PeerStatusSchema = z.object({
  name: z.string(),
  address: z.string(),
});

export const ClusterStatusSchema = z.object({
  name: z.string().optional(),
  status: z.enum(['ready', 'settling', 'disabled']),
  peers: z.array(PeerStatusSchema).optional(),
});

export const VersionInfoSchema = z.object({
  version: z.string(),
  revision: z.string(),
  branch: z.string(),
  buildUser: z.string(),
  buildDate: z.string(),
  goVersion: z.string(),
});

/**
 * The `global:` block of an Alertmanager configuration: connection defaults every receiver
 * inherits unless it overrides them.
 *
 * Unknown keys are kept as-is. Alertmanager adds a `*_api_url` here for practically every new
 * integration, and dropping one would take the user's configuration with it — an unrecognised
 * key we pass back unchanged is much better than a key we silently delete.
 *
 * Based on: https://prometheus.io/docs/alerting/latest/configuration/#configuration-file
 */
export const GlobalConfigSchema = z.looseObject({
  resolve_timeout: z.string().optional(),
  http_config: HTTPConfigSchema.optional(),

  smtp_from: z.string().optional(),
  smtp_hello: z.string().optional(),
  smtp_smarthost: z.string().optional(),
  smtp_auth_username: z.string().optional(),
  smtp_auth_password: z.string().optional(),
  smtp_auth_password_file: z.string().optional(),
  smtp_auth_identity: z.string().optional(),
  smtp_auth_secret: z.string().optional(),
  smtp_require_tls: z.boolean().optional(),
  smtp_tls_config: TLSConfigSchema.optional(),

  slack_api_url: z.string().optional(),
  slack_api_url_file: z.string().optional(),

  victorops_api_key: z.string().optional(),
  victorops_api_key_file: z.string().optional(),
  victorops_api_url: z.string().optional(),

  pagerduty_url: z.string().optional(),

  opsgenie_api_key: z.string().optional(),
  opsgenie_api_key_file: z.string().optional(),
  opsgenie_api_url: z.string().optional(),

  wechat_api_url: z.string().optional(),
  wechat_api_secret: z.string().optional(),
  wechat_api_corp_id: z.string().optional(),

  telegram_api_url: z.string().optional(),
  webex_api_url: z.string().optional(),

  rocketchat_api_url: z.string().optional(),
  rocketchat_token: z.string().optional(),
  rocketchat_token_id: z.string().optional(),

  jira_api_url: z.string().optional(),
});
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;

export const TimeIntervalSchema = z.object({
  name: z.string(),
  time_intervals: z
    .array(
      z.object({
        times: z
          .array(
            z.object({
              start_time: z.string(),
              end_time: z.string(),
            })
          )
          .optional(),
        weekdays: z.array(z.string()).optional(),
        days_of_month: z.array(z.string()).optional(),
        months: z.array(z.string()).optional(),
        years: z.array(z.string()).optional(),
        location: z.string().optional(),
      })
    )
    .optional(),
});

export const InhibitRuleSchema = z.object({
  // Current properties
  target_matchers: z.array(z.string()).optional(),
  source_matchers: z.array(z.string()).optional(),
  equal: z.array(z.string()).optional(),
  // Deprecated properties (kept for backward compatibility)
  target_match: z.record(z.string(), z.string()).optional(),
  target_match_re: z.record(z.string(), z.string()).optional(),
  source_match: z.record(z.string(), z.string()).optional(),
  source_match_re: z.record(z.string(), z.string()).optional(),
});

export const RoutesSchema = z.object({
  receiver: z.string().optional(),
  group_by: z.array(z.string()).optional(),
  continue: z.boolean().optional(),
  routes: z.array(z.any()).optional(),
  group_wait: z.string().optional(),
  group_interval: z.string().optional(),
  repeat_interval: z.string().optional(),
  match: z.record(z.string(), z.string()).optional(),
  match_re: z.record(z.string(), z.string()).optional(),
  matchers: z.array(z.string()).optional(),
  mute_time_intervals: z.array(z.string()).optional(),
  active_time_intervals: z.array(z.string()).optional(),
});
export type Route = z.infer<typeof RoutesSchema>;

export const AlertmanagerConfigSchema = z.object({
  original: z.string(),
});

export const AlertmanagerStatusSchema = z.object({
  cluster: ClusterStatusSchema,
  versionInfo: VersionInfoSchema,
  config: AlertmanagerConfigSchema,
  uptime: z.string(),
});

export const SilenceStatusSchema = z.object({
  state: z.enum(['expired', 'active', 'pending']),
});

export const MatcherSchema = z.object({
  name: z.string(),
  value: z.string(),
  isRegex: z.boolean(),
  isEqual: z.boolean().optional(),
});

export const MatchersSchema = z.array(MatcherSchema);

export const SilenceSchema = z.object({
  matchers: MatchersSchema,
  startsAt: z.string(),
  endsAt: z.string(),
  createdBy: z.string(),
  comment: z.string(),
});

export const GettableSilenceSchema = SilenceSchema.extend({
  id: z.string(),
  status: SilenceStatusSchema,
  updatedAt: z.string(),
});

export const GettableSilencesSchema = z.array(GettableSilenceSchema);

export const PostableSilenceSchema = SilenceSchema.extend({
  id: z.string().optional(),
});

export const LabelSetSchema = z.record(z.string(), z.string());

export const AlertStatusSchema = z.object({
  state: z.enum(['unprocessed', 'active', 'suppressed']),
  silencedBy: z.array(z.string()).optional().default([]),
  inhibitedBy: z.array(z.string()).optional().default([]),
  mutedBy: z.array(z.string()).optional().default([]),
});

export const AlertSchema = z.object({
  labels: LabelSetSchema,
  generatorURL: z.string().optional(),
});

export const GettableAlertSchema = AlertSchema.extend({
  annotations: LabelSetSchema,
  receivers: z.array(ReceiverSchema),
  fingerprint: z.string(),
  startsAt: z.string(),
  updatedAt: z.string(),
  endsAt: z.string(),
  status: AlertStatusSchema,
});

export const GettableAlertsSchema = z.array(GettableAlertSchema);

export const PostableAlertSchema = AlertSchema.extend({
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  annotations: LabelSetSchema.optional(),
});

export const PostableAlertsSchema = z.array(PostableAlertSchema);

export const AlertGroupSchema = z.object({
  labels: LabelSetSchema,
  receiver: ReceiverSchema,
  alerts: z.array(GettableAlertSchema),
});

export const AlertGroupsSchema = z.array(AlertGroupSchema);

// Export inferred types
export type PeerStatus = z.infer<typeof PeerStatusSchema>;
export type ClusterStatus = z.infer<typeof ClusterStatusSchema>;
export type VersionInfo = z.infer<typeof VersionInfoSchema>;
export type TimeInterval = z.infer<typeof TimeIntervalSchema>;
export type InhibitRule = z.infer<typeof InhibitRuleSchema>;
export type AlertmanagerConfig = z.infer<typeof AlertmanagerConfigSchema>;
export type AlertmanagerStatus = z.infer<typeof AlertmanagerStatusSchema>;
export type SilenceStatus = z.infer<typeof SilenceStatusSchema>;
export type Matcher = z.infer<typeof MatcherSchema>;
export type Matchers = z.infer<typeof MatchersSchema>;
export type Silence = z.infer<typeof SilenceSchema>;
export type GettableSilence = z.infer<typeof GettableSilenceSchema>;
export type GettableSilences = z.infer<typeof GettableSilencesSchema>;
export type PostableSilence = z.infer<typeof PostableSilenceSchema>;
export type LabelSet = z.infer<typeof LabelSetSchema>;
export type AlertStatus = z.infer<typeof AlertStatusSchema>;
export type Alert = z.infer<typeof AlertSchema>;
export type GettableAlert = z.infer<typeof GettableAlertSchema>;
export type GettableAlerts = z.infer<typeof GettableAlertsSchema>;
export type PostableAlert = z.infer<typeof PostableAlertSchema>;
export type PostableAlerts = z.infer<typeof PostableAlertsSchema>;
export type AlertGroup = z.infer<typeof AlertGroupSchema>;
export type AlertGroups = z.infer<typeof AlertGroupsSchema>;

// API response types with schemas
export const GetStatusApiResponseSchema = AlertmanagerStatusSchema;
export type GetStatusApiResponse = z.infer<typeof GetStatusApiResponseSchema>;
export type GetStatusApiArg = void;

export const GetReceiversApiResponseSchema = z.array(ReceiverSchema);
export type GetReceiversApiResponse = z.infer<typeof GetReceiversApiResponseSchema>;
export type GetReceiversApiArg = void;

export const GetSilencesApiResponseSchema = GettableSilencesSchema;
export type GetSilencesApiResponse = z.infer<typeof GetSilencesApiResponseSchema>;
export type GetSilencesApiArg = {
  filter?: string[];
};

export const PostSilencesApiResponseSchema = z.object({
  silenceID: z.string().optional(),
});
export type PostSilencesApiResponse = z.infer<typeof PostSilencesApiResponseSchema>;
export type PostSilencesApiArg = {
  postableSilence: PostableSilence;
};

export const GetSilenceApiResponseSchema = GettableSilenceSchema;
export type GetSilenceApiResponse = z.infer<typeof GetSilenceApiResponseSchema>;
export type GetSilenceApiArg = {
  silenceId: string;
};

export type DeleteSilenceApiResponse = unknown;
export type DeleteSilenceApiArg = {
  silenceId: string;
};

export const GetAlertsApiResponseSchema = GettableAlertsSchema;
export type GetAlertsApiResponse = z.infer<typeof GetAlertsApiResponseSchema>;
export type GetAlertsApiArg = {
  active?: boolean;
  silenced?: boolean;
  inhibited?: boolean;
  unprocessed?: boolean;
  filter?: string[];
  receiver?: string;
};

export type PostAlertsApiResponse = unknown;
export type PostAlertsApiArg = {
  postableAlerts: PostableAlerts;
};

export const GetAlertGroupsApiResponseSchema = AlertGroupsSchema;
export type GetAlertGroupsApiResponse = z.infer<typeof GetAlertGroupsApiResponseSchema>;
export type GetAlertGroupsApiArg = {
  active?: boolean;
  silenced?: boolean;
  inhibited?: boolean;
  muted?: boolean;
  filter?: string[];
  receiver?: string;
};
