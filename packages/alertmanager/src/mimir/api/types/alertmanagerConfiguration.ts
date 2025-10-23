import { z } from 'zod';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { ParsedAlertmanagerConfigSchema } from '../../../vanilla';

export const UserConfigurationSchema = z.object({
  template_files: z.record(z.string(), z.string()),
  alertmanager_config: z.string(),
});
export type UserConfiguration = z.infer<typeof UserConfigurationSchema>;

export const ParsedUserConfigurationSchema = z.object({
  template_files: z.record(z.string(), z.string()),
  alertmanager_config: ParsedAlertmanagerConfigSchema,
});
export type ParsedUserConfiguration = z.infer<typeof ParsedUserConfigurationSchema>;

/**
 * This codec will translate the Mimir configuration (after having YAML parsed) to a completely parsed user configuration.
 * We have to decode YAML twice because the Mimir API responds with a YAML payload and the entire alertmanager_config is _also_ encoded as YAML inside the entire YAML response.
 */
const UserConfigurationSchemaCodec = z.codec(UserConfigurationSchema, ParsedUserConfigurationSchema, {
  decode: (userConfiguration) => {
    // Mimir may return an empty string for alertmanager_config when no config exists.
    // YAML parsing of an empty string yields null. Treat only that case as an empty configuration; otherwise validate strictly and surface schema errors.
    const decodedConfiguration = parseYaml(userConfiguration.alertmanager_config);
    if (decodedConfiguration == null) {
      return {
        ...userConfiguration,
        alertmanager_config: ParsedAlertmanagerConfigSchema.parse({}),
      };
    }

    const parsed = ParsedAlertmanagerConfigSchema.safeParse(decodedConfiguration);
    if (!parsed.success) {
      throw parsed.error;
    }

    return {
      ...userConfiguration,
      alertmanager_config: parsed.data,
    };
  },
  encode: (userConfiguration) => ({
    ...userConfiguration,
    alertmanager_config: stringifyYaml(userConfiguration.alertmanager_config),
  }),
});

/**
 * This codec will translate the Mimir API response (which is a YAML response) to a completely parsed user configuration.
 */
export const YamlToParsedUserConfiguration = z.codec(z.string(), ParsedUserConfigurationSchema, {
  decode: (string) => {
    // 1. convert the YAML API response to a object with { template_files: {}, alertmanager_config: "" }
    // ⚠️ the alertmanager_config is still a YAML encoded string! We have to parse that too.
    const parsedJSON = parseYaml(string);
    const userConfiguration = UserConfigurationSchema.parse(parsedJSON);

    return UserConfigurationSchemaCodec.decode(userConfiguration);
  },
  encode: (userConfiguration) => {
    const encodedAlertmanagerConfig = UserConfigurationSchemaCodec.encode(userConfiguration);
    return stringifyYaml(encodedAlertmanagerConfig);
  },
});

/**
 * This codec will convert a TransformedAlertmanagerStatusApiResponse (from the vanilla Alertmanager API)
 * to a ParsedUserConfiguration (Mimir format).
 *
 * The TransformedAlertmanagerStatusApiResponse contains config.parsed which is a ParsedAlertmanagerConfig,
 * while ParsedUserConfiguration wraps this in { template_files, alertmanager_config }.
 *
 * Note: When decoding from TransformedAlertmanagerStatusApiResponse, template_files will be empty
 * since vanilla Alertmanager doesn't expose templates through the status endpoint.
 */
export const TransformedStatusToParsedUserConfiguration = {
  decode: (statusResponse: {
    config: { parsed: z.infer<typeof ParsedAlertmanagerConfigSchema> };
  }): ParsedUserConfiguration => {
    return {
      template_files: {},
      alertmanager_config: statusResponse.config.parsed,
    };
  },
  encode: (
    userConfiguration: ParsedUserConfiguration
  ): { config: { parsed: z.infer<typeof ParsedAlertmanagerConfigSchema> } } => {
    return {
      config: {
        parsed: userConfiguration.alertmanager_config,
      },
    };
  },
};
