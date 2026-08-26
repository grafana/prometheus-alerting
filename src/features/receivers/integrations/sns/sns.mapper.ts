import type { SNSConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createSNSSettingsFormSchema, SNSSettingsFormValues } from './sns.schema';

export function snsConfigToFormSettings(config: SNSConfig): SNSSettingsFormValues {
  return createSNSSettingsFormSchema().parse(structuredClone(config));
}

export function snsFormSettingsToConfig(values: SNSSettingsFormValues): SNSConfig {
  return omitEmptyValues(createSNSSettingsFormSchema().parse(values));
}

export function createDefaultSNSSettings(): SNSSettingsFormValues {
  return {};
}
