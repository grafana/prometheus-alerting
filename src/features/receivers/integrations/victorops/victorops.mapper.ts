import type { VictorOpsConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createVictorOpsSettingsFormSchema, VictorOpsSettingsFormValues } from './victorops.schema';
export function victorOpsConfigToFormSettings(config: VictorOpsConfig): VictorOpsSettingsFormValues {
  const settings = structuredClone(config);
  settings.routing_key ??= '';
  return createVictorOpsSettingsFormSchema(false).parse(settings);
}
export function victorOpsFormSettingsToConfig(values: VictorOpsSettingsFormValues): VictorOpsConfig {
  return omitEmptyValues(createVictorOpsSettingsFormSchema(false).parse(values));
}
export function createDefaultVictorOpsSettings(): VictorOpsSettingsFormValues {
  return { routing_key: '' };
}
