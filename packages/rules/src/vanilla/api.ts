import { z } from 'zod';

// Basic types
export const LabelsSchema = z.record(z.string(), z.string());
export type Labels = z.infer<typeof LabelsSchema>;

export const AnnotationsSchema = z.record(z.string(), z.string());
export type Annotations = z.infer<typeof AnnotationsSchema>;

export const PromRuleTypeSchema = z.enum(['alerting', 'recording']);
export type PromRuleType = z.infer<typeof PromRuleTypeSchema>;

export const PromAlertingRuleStateSchema = z.enum(['firing', 'inactive', 'pending', 'recovering', 'unknown']);
export type PromAlertingRuleState = z.infer<typeof PromAlertingRuleStateSchema>;

export const PromAlertStateSchema = z.enum(['firing', 'pending']);
export type PromAlertState = z.infer<typeof PromAlertStateSchema>;

// Prometheus Rules (from /api/v1/rules)
const PromRuleDTOBaseSchema = z.object({
  health: z.string(),
  name: z.string(),
  query: z.string(), // expr
  evaluationTime: z.number().optional(),
  lastEvaluation: z.string().optional(),
  lastError: z.string().optional(),
});

export const PromAlertSchema = z.object({
  labels: LabelsSchema,
  annotations: AnnotationsSchema,
  state: PromAlertStateSchema,
  activeAt: z.string(),
  value: z.string(),
});
export type PromAlert = z.infer<typeof PromAlertSchema>;

export const PromAlertingRuleDTOSchema = PromRuleDTOBaseSchema.extend({
  alerts: z.array(PromAlertSchema).optional(),
  labels: LabelsSchema.optional(),
  annotations: AnnotationsSchema.optional(),
  duration: z.number().optional(), // for
  state: PromAlertingRuleStateSchema,
  type: z.literal('alerting'),
});
export type PromAlertingRuleDTO = z.infer<typeof PromAlertingRuleDTOSchema>;

export const PromRecordingRuleDTOSchema = PromRuleDTOBaseSchema.extend({
  type: z.literal('recording'),
  labels: LabelsSchema.optional(),
});
export type PromRecordingRuleDTO = z.infer<typeof PromRecordingRuleDTOSchema>;

export const PromRuleDTOSchema = z.discriminatedUnion('type', [PromAlertingRuleDTOSchema, PromRecordingRuleDTOSchema]);
export type PromRuleDTO = z.infer<typeof PromRuleDTOSchema>;

export const PromRuleGroupDTOSchema = z.object({
  name: z.string(),
  file: z.string(),
  rules: z.array(PromRuleDTOSchema),
  interval: z.number(),
  evaluationTime: z.number().optional(), // these 2 are not in older prometheus payloads
  lastEvaluation: z.string().optional(),
});
export type PromRuleGroupDTO = z.infer<typeof PromRuleGroupDTOSchema>;

// Ruler rule DTOs (from Ruler API /api/v1/rules/*)
const RulerRuleBaseDTOSchema = z.object({
  expr: z.string(),
  labels: LabelsSchema.optional(),
});

export const RulerRecordingRuleDTOSchema = RulerRuleBaseDTOSchema.extend({
  record: z.string(),
});
export type RulerRecordingRuleDTO = z.infer<typeof RulerRecordingRuleDTOSchema>;

export const RulerAlertingRuleDTOSchema = RulerRuleBaseDTOSchema.extend({
  alert: z.string(),
  for: z.string().optional(),
  annotations: AnnotationsSchema.optional(),
  keep_firing_for: z.string().optional(),
});
export type RulerAlertingRuleDTO = z.infer<typeof RulerAlertingRuleDTOSchema>;

// Ruler rules don't have a 'type' field, so we discriminate based on 'alert' vs 'record'
// We use a union instead of discriminatedUnion since the discriminator fields are different
export const RulerRuleDTOSchema = z.union([RulerAlertingRuleDTOSchema, RulerRecordingRuleDTOSchema]);
export type RulerRuleDTO = z.infer<typeof RulerRuleDTOSchema>;

/**
 * A rule group as the Ruler API returns it, and as we write it back.
 *
 * ⚠️ Anything missing here is dropped: a group is read, edited, and POSTed whole, and this schema
 * decides what survives the read. Beyond Prometheus' own `name`, `interval`, `limit` and
 * `query_offset`, that means the Mimir-specific group settings -- losing `source_tenants` turns a
 * cross-tenant federated group into a single-tenant one, and its rules then evaluate against the
 * wrong data.
 */
export const RulerRuleGroupDTOSchema = z.object({
  name: z.string(),
  interval: z.string().optional(),
  /** Maximum number of alerts or series a single rule in this group may produce. */
  limit: z.number().optional(),
  /** How far back to shift the evaluation query, e.g. to wait for late samples. */
  query_offset: z.string().optional(),
  /** Mimir's older name for `query_offset`, still accepted by the Ruler. */
  evaluation_delay: z.string().optional(),
  /** Mimir: tenants whose data this group's rules read, making the group federated. */
  source_tenants: z.array(z.string()).optional(),
  /** Mimir: evaluate on interval boundaries rather than at an arbitrary offset. */
  align_evaluation_time_on_interval: z.boolean().optional(),
  rules: z.array(RulerRuleDTOSchema),
});
export type RulerRuleGroupDTO = z.infer<typeof RulerRuleGroupDTOSchema>;

// API response schemas
export const GetPromRulesApiResponseSchema = z.object({
  status: z.string(),
  data: z.object({
    groups: z.array(PromRuleGroupDTOSchema),
    groupNextToken: z.string().optional(),
  }),
  errorType: z.string().optional(),
  error: z.string().optional(),
});
export type GetPromRulesApiResponse = z.infer<typeof GetPromRulesApiResponseSchema>;

export const GetRulerRuleGroupApiResponseSchema = RulerRuleGroupDTOSchema.nullable();
export type GetRulerRuleGroupApiResponse = z.infer<typeof GetRulerRuleGroupApiResponseSchema>;
