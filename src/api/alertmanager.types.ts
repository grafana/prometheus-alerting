import {
  AlertmanagerConfigSchema,
  AlertmanagerStatusSchema,
  ParsedAlertmanagerConfigSchema,
} from '@grafana/external-alertmanager/vanilla';
import { parse as parseYaml } from '@std/yaml';
import z from 'zod';

// Schema for validating the transformed response (with parsed config)
export const TransformedAlertmanagerStatusApiResponseSchema = AlertmanagerStatusSchema.extend({
  config: AlertmanagerConfigSchema.extend({
    parsed: ParsedAlertmanagerConfigSchema,
  }),
});
export type TransformedAlertmanagerStatusApiResponse = z.output<typeof TransformedAlertmanagerStatusApiResponseSchema>;

// Schema that transforms AlertmanagerStatus by parsing the YAML config
export const TransformedAlertmanagerStatusApiResponseTransform =
  AlertmanagerStatusSchema.transform<TransformedAlertmanagerStatusApiResponse>((data) => {
    // Parse the YAML configuration from `data.config.original`
    const parsedYamlConfig = parseYaml(data.config.original);

    // Validate the parsed YAML against the expected schema
    const parsed = ParsedAlertmanagerConfigSchema.parse(parsedYamlConfig);

    return {
      ...data,
      config: {
        ...data.config,
        parsed,
      },
    };
  });

// Type to include dataSourceUID and implementation in API arguments
export type WithDataSourceInformation<T = void> = T extends void
  ? { dataSourceUID: string; implementation: 'prometheus' | 'mimir' | 'cortex' }
  : T & { dataSourceUID: string; implementation: 'prometheus' | 'mimir' | 'cortex' };

// Type guard to check if args is an object with dataSourceUID
export function hasDataSourceUID(args: unknown): args is { dataSourceUID: string } {
  return typeof args === 'object' && args !== null && 'dataSourceUID' in args;
}

// Type guard to check if args has implementation field
export function hasImplementation(args: unknown): args is { implementation: 'prometheus' | 'mimir' | 'cortex' } {
  return typeof args === 'object' && args !== null && 'implementation' in args;
}
