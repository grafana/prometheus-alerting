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

export const PostableParsedUserConfigurationSchema = z.object({
  template_files: z.record(z.string(), z.string()),
  // ⚠️ when posting a Mimir configuration, receivers and route are NOT optional!
  alertmanager_config: ParsedAlertmanagerConfigSchema.required({
    receivers: true,
    route: true,
  }),
});
export type PostableParsedUserConfiguration = z.infer<typeof PostableParsedUserConfigurationSchema>;

/**
 * This is mostly used in very rare scenarios where the user configuration is not yet initialized or
 * was initialized to be completely empty. Mimir does this when it sees a new tenant.
 *
 * The API will reject any updates to the configuration until at least one receiver and route with receiver have been added.
 *
 * Adapted from https://github.com/grafana/mimir/blob/c5a3a726a19472bd1019fb957316008fd988b040/pkg/alertmanager/multitenant.go#L408-L418
 *
 */
export const initialAlertmanagerConfiguration: PostableParsedUserConfiguration = {
  alertmanager_config: {
    route: {
      receiver: 'empty-receiver',
      // these timing options are the hard-coded defaults from
      // https://github.com/prometheus/alertmanager/blob/17c791d747b29719741182e8058616303397a073/dispatch/route.go#L32-L38
      group_wait: '30s',
      group_interval: '5m',
      repeat_interval: '4h',
    },
    receivers: [
      {
        name: 'empty-receiver',
      },
    ],
    time_intervals: [],
    inhibit_rules: [],
    templates: [],
  },
  template_files: {},
} as const;

/**
 * Turns a parsed configuration back into the shape Mimir wants, where the whole alertmanager_config
 * is one YAML string. Both codecs below share this, so both get handed exactly the same value: the
 * type is the "input" side of ParsedUserConfigurationSchema, because zod has already run the nested
 * codecs (like yamlString()) by the time an encode function is called.
 */
function encodeUserConfiguration(userConfiguration: z.input<typeof ParsedUserConfigurationSchema>): UserConfiguration {
  return {
    ...userConfiguration,
    alertmanager_config: stringifyYaml(userConfiguration.alertmanager_config),
  };
}

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
  encode: encodeUserConfiguration,
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

    if (userConfiguration.alertmanager_config === '') {
      return initialAlertmanagerConfiguration;
    }

    const decodedConfig = UserConfigurationSchemaCodec.decode(userConfiguration);
    return decodedConfig;
  },
  encode: (userConfiguration) => stringifyYaml(encodeUserConfiguration(userConfiguration)),
});
