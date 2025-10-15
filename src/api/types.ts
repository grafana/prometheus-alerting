import { AlertmanagerConfigSchema, AlertmanagerStatusSchema, ParsedAlertmanagerConfigSchema } from "@grafana/external-alertmanager/vanilla";
import z from "zod";

export const TransformedAlertmanagerStatusApiResponseSchema = AlertmanagerStatusSchema.extend({
  config: AlertmanagerConfigSchema.extend({
    parsed: ParsedAlertmanagerConfigSchema,
  }),
});

export type TransformedAlertmanagerStatusApiResponse = z.infer<typeof TransformedAlertmanagerStatusApiResponseSchema>;
