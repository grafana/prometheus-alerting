import { AlertmanagerConfigSchema, AlertmanagerStatusSchema, ParsedAlertmanagerConfigSchema } from "@grafana/external-alertmanager/vanilla";
import z from "zod";

export const TransformedAlertmanagerStatusApiResponseSchema = AlertmanagerStatusSchema.extend({
  config: AlertmanagerConfigSchema.extend({
    parsed: ParsedAlertmanagerConfigSchema,
  }),
});

export type TransformedAlertmanagerStatusApiResponse = z.infer<typeof TransformedAlertmanagerStatusApiResponseSchema>;

// Type to include dataSourceUID in API arguments
export type WithDataSourceUID<T = void> = T extends void ? { dataSourceUID: string } : T & { dataSourceUID: string };

// Type guard to check if args is an object with dataSourceUID
export function hasDataSourceUID(args: unknown): args is { dataSourceUID: string } {
  return typeof args === 'object' && args !== null && 'dataSourceUID' in args;
}
