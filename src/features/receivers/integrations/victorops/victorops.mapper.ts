import type { VictorOpsConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createVictorOpsSettingsSchema, VictorOpsSettingsFormValues } from './victorops.schema';
export function victorOpsConfigToFormSettings(config: VictorOpsConfig): VictorOpsSettingsFormValues {
  const settings = structuredClone(config);
  settings.routing_key ??= '';
  return createVictorOpsSettingsSchema().parse(settings);
}
export function victorOpsFormSettingsToConfig(values: VictorOpsSettingsFormValues): VictorOpsConfig {
  return omitEmptyValues(createVictorOpsSettingsSchema().parse(values));
}
export function createDefaultVictorOpsSettings(): VictorOpsSettingsFormValues {
  return { routing_key: '' };
}
