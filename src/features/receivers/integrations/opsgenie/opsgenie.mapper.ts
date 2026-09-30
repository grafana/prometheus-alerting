import type { OpsGenieConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createOpsgenieSettingsSchema, OpsgenieSettingsFormValues } from './opsgenie.schema';
export function opsgenieConfigToFormSettings(config: OpsGenieConfig): OpsgenieSettingsFormValues {
  return createOpsgenieSettingsSchema().parse(structuredClone(config));
}
export function opsgenieFormSettingsToConfig(values: OpsgenieSettingsFormValues): OpsGenieConfig {
  return omitEmptyValues(createOpsgenieSettingsSchema().parse(values));
}
export function createDefaultOpsgenieSettings(): OpsgenieSettingsFormValues {
  return {};
}
