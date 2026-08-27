import type { DiscordConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createDiscordSettingsFormSchema, DiscordSettingsFormValues } from './discord.schema';
export function discordConfigToFormSettings(config: DiscordConfig): DiscordSettingsFormValues {
  const settings = structuredClone(config);
  settings.webhook_url ??= '';
  return createDiscordSettingsFormSchema().parse(settings);
}
export function discordFormSettingsToConfig(values: DiscordSettingsFormValues): DiscordConfig {
  return omitEmptyValues(createDiscordSettingsFormSchema().parse(values));
}
export function createDefaultDiscordSettings(): DiscordSettingsFormValues {
  return { webhook_url: '', http_config: {} };
}
