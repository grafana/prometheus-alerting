import { AlertmanagerConfigSchema, AlertmanagerStatusSchema, ParsedAlertmanagerConfigSchema } from "@grafana/external-alertmanager/vanilla";
import z from "zod";

export const TransformedAlertmanagerStatusApiResponseSchema = AlertmanagerStatusSchema.extend({
  config: AlertmanagerConfigSchema.extend({
    parsed: ParsedAlertmanagerConfigSchema,
  }),
});

export type TransformedAlertmanagerStatusApiResponse = z.infer<typeof TransformedAlertmanagerStatusApiResponseSchema>;

// Type to include dataSourceUID and implementation in API arguments
export type WithDataSourceUID<T = void> = T extends void
  ? { dataSourceUID: string; implementation?: 'prometheus' | 'mimir' | 'cortex' }
  : T & { dataSourceUID: string; implementation?: 'prometheus' | 'mimir' | 'cortex' };

// Type guard to check if args is an object with dataSourceUID
export function hasDataSourceUID(args: unknown): args is { dataSourceUID: string } {
  return typeof args === 'object' && args !== null && 'dataSourceUID' in args;
}

// Type guard to check if args has implementation field
export function hasImplementation(args: unknown): args is { implementation: 'prometheus' | 'mimir' | 'cortex' } {
  return typeof args === 'object' && args !== null && 'implementation' in args;
}
