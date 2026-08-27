import type { OpsGenieConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createOpsgenieSettingsFormSchema, OpsgenieSettingsFormValues } from './opsgenie.schema';
export function opsgenieConfigToFormSettings(config: OpsGenieConfig): OpsgenieSettingsFormValues {
  return createOpsgenieSettingsFormSchema(false).parse(structuredClone(config));
}
export function opsgenieFormSettingsToConfig(values: OpsgenieSettingsFormValues): OpsGenieConfig {
  return omitEmptyValues(createOpsgenieSettingsFormSchema(false).parse(values));
}
export function createDefaultOpsgenieSettings(): OpsgenieSettingsFormValues {
  return {};
}
