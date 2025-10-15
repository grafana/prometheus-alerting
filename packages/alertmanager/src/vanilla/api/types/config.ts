import z from "zod";
import { InhibitRuleSchema, ReceiverSchema, TimeIntervalSchema } from "./common";

/**
 * This is the Alertmanager configuration definition after we've parsed the YAML config from the "config.source" property
 */
export const ParsedAlertmanagerConfigSchema = z
  .object({
    receivers: z.array(ReceiverSchema).optional(),
    route: z
      .object({
        receiver: z.string().optional(),
        group_by: z.array(z.string()).optional(),
        continue: z.boolean().optional(),
        routes: z.array(z.any()).optional(),
        group_wait: z.string().optional(),
        group_interval: z.string().optional(),
        repeat_interval: z.string().optional(),
        matchers: z.array(z.string()).optional(),
      })
      .optional(),
    templates: z.array(z.string()).optional(),
    time_intervals: z.array(TimeIntervalSchema).optional(),
    inhibit_rules: z.array(InhibitRuleSchema).optional(),
  })
  .catchall(z.any());

export type ParsedAlertmanagerConfig = z.infer<typeof ParsedAlertmanagerConfigSchema>;
