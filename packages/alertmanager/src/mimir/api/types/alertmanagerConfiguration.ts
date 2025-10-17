import { z } from 'zod';
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
