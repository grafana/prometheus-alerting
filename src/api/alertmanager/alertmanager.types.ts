import { AlertmanagerStatusSchema, ParsedAlertmanagerConfigSchema } from '@grafana/external-alertmanager/vanilla';
import { parse as parseYaml } from 'yaml';
import z from 'zod';

export const ReadOnlyAlertmanagerConfigurationSchema = z.object({
  template_files: z.record(z.string(), z.string()),
  alertmanager_config: ParsedAlertmanagerConfigSchema,
});
export type ReadOnlyAlertmanagerConfiguration = z.infer<typeof ReadOnlyAlertmanagerConfigurationSchema>;

/**
 * Parses the YAML config embedded in an AlertmanagerStatus response and reshapes it into the
 * same { template_files, alertmanager_config } envelope used for the writable Mimir configuration.
 *
 * template_files is always empty here since vanilla Alertmanager doesn't expose templates through /v2/status.
 */
export const AlertmanagerStatusToReadOnlyConfiguration = AlertmanagerStatusSchema.transform<
  z.infer<typeof ReadOnlyAlertmanagerConfigurationSchema>
>((data) => ({
  template_files: {},
  alertmanager_config: ParsedAlertmanagerConfigSchema.parse(parseYaml(data.config.original)),
}));

// Type to include dataSourceUID and implementation in API arguments
export type WithDataSourceInformation<T = void> = T extends void
  ? { dataSourceUID: string }
  : T & { dataSourceUID: string };
