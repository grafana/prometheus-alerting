import z from 'zod';
import { InhibitRuleSchema, ReceiverSchema, RoutesSchema, TimeIntervalSchema } from './common';

/**
 * This is the Alertmanager configuration definition after we've parsed the YAML config from the "config.source" property
 */
export const ParsedAlertmanagerConfigSchema = z.object({
  receivers: z.array(ReceiverSchema).optional(),
  route: RoutesSchema.optional(),
  templates: z.array(z.string()).optional(),
  time_intervals: z.array(TimeIntervalSchema).optional(),
  mute_time_intervals: z.array(TimeIntervalSchema).optional(),
  inhibit_rules: z.array(InhibitRuleSchema).optional(),
});

export type ParsedAlertmanagerConfig = z.infer<typeof ParsedAlertmanagerConfigSchema>;
