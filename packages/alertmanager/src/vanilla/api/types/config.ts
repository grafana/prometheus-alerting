import z from 'zod';
import { GlobalConfigSchema, InhibitRuleSchema, ReceiverSchema, RoutesSchema, TimeIntervalSchema } from './common';

/**
 * This is the Alertmanager configuration definition after we've parsed the YAML config from the "config.source" property
 *
 * ⚠️ Every key Alertmanager accepts has to be listed here. We parse a configuration, apply the
 * user's edit to the result, and POST that back — so a key this schema doesn't know about is a key
 * the user loses the next time they save anything.
 */
export const ParsedAlertmanagerConfigSchema = z.object({
  global: GlobalConfigSchema.optional(),
  receivers: z.array(ReceiverSchema).optional(),
  route: RoutesSchema.optional(),
  templates: z.array(z.string()).optional(),
  time_intervals: z.array(TimeIntervalSchema).optional(),
  mute_time_intervals: z.array(TimeIntervalSchema).optional(),
  inhibit_rules: z.array(InhibitRuleSchema).optional(),
});

export type ParsedAlertmanagerConfig = z.infer<typeof ParsedAlertmanagerConfigSchema>;
