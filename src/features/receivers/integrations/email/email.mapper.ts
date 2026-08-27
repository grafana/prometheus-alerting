import type { EmailConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createEmailSettingsFormSchema, EmailSettingsFormValues } from './email.schema';

export function emailConfigToFormSettings(config: EmailConfig): EmailSettingsFormValues {
  const settings = structuredClone(config);
  settings.to ??= '';
  return createEmailSettingsFormSchema(false).parse(settings);
}

export function emailFormSettingsToConfig(values: EmailSettingsFormValues): EmailConfig {
  return omitEmptyValues(createEmailSettingsFormSchema(false).parse(values));
}

export function createDefaultEmailSettings(): EmailSettingsFormValues {
  return { to: '' };
}
