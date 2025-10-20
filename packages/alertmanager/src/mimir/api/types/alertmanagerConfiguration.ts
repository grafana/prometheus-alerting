import { z } from 'zod';
import { parse, stringify } from '@std/yaml';

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
  decode: (userConfiguration) => ({
    ...userConfiguration,
    alertmanager_config: ParsedAlertmanagerConfigSchema.parse(userConfiguration.alertmanager_config),
  }),
  encode: (userConfiguration) => ({
    ...userConfiguration,
    alertmanager_config: stringify(userConfiguration.alertmanager_config),
  }),
});

/**
 * This codec will translate the Mimir API response (which is a YAML response) to a completely parsed user configuration.
 */
export const YamlToParsedUserConfiguration = z.codec(z.string(), ParsedUserConfigurationSchema, {
  decode: (string) => {
    const parsedJSON = parse(string);
    return UserConfigurationSchemaCodec.decode(UserConfigurationSchema.parse(parsedJSON));
  },
  encode: (json) => stringify(json),
});
