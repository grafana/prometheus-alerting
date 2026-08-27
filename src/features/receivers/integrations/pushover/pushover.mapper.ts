import type { PushoverConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createPushoverSettingsFormSchema, PushoverSettingsFormValues } from './pushover.schema';
export function pushoverConfigToFormSettings(config: PushoverConfig): PushoverSettingsFormValues {
  const settings = structuredClone(config);
  settings.user_key ??= '';
  settings.token ??= '';
  return createPushoverSettingsFormSchema(false).parse(settings);
}
export function pushoverFormSettingsToConfig(values: PushoverSettingsFormValues): PushoverConfig {
  return omitEmptyValues(createPushoverSettingsFormSchema(false).parse(values));
}
export function createDefaultPushoverSettings(): PushoverSettingsFormValues {
  return { user_key: '', token: '' };
}
