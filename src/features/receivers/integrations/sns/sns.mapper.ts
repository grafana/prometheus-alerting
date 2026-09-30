import type { SNSConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { SNSSettingsSchema, SNSSettingsFormValues } from './sns.schema';

export function snsConfigToFormSettings(config: SNSConfig): SNSSettingsFormValues {
  return SNSSettingsSchema.parse(structuredClone(config));
}

export function snsFormSettingsToConfig(values: SNSSettingsFormValues): SNSConfig {
  return omitEmptyValues(SNSSettingsSchema.parse(values));
}

export function createDefaultSNSSettings(): SNSSettingsFormValues {
  return {};
}
