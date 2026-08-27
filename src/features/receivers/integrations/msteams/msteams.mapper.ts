import type { MSTeamsConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createMSTeamsSettingsFormSchema, MSTeamsSettingsFormValues } from './msteams.schema';
export function msTeamsConfigToFormSettings(config: MSTeamsConfig): MSTeamsSettingsFormValues {
  const settings = structuredClone(config);
  settings.webhook_url ??= '';
  return createMSTeamsSettingsFormSchema().parse(settings);
}
export function msTeamsFormSettingsToConfig(values: MSTeamsSettingsFormValues): MSTeamsConfig {
  return omitEmptyValues(createMSTeamsSettingsFormSchema().parse(values));
}
export function createDefaultMSTeamsSettings(): MSTeamsSettingsFormValues {
  return { webhook_url: '', http_config: {} };
}
