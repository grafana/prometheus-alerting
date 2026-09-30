import type { EmailConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createEmailSettingsSchema, EmailSettingsFormValues } from './email.schema';

export function emailConfigToFormSettings(config: EmailConfig): EmailSettingsFormValues {
  const settings = structuredClone(config);
  settings.to ??= '';
  return createEmailSettingsSchema().parse(settings);
}

export function emailFormSettingsToConfig(values: EmailSettingsFormValues): EmailConfig {
  return omitEmptyValues(createEmailSettingsSchema().parse(values));
}

export function createDefaultEmailSettings(): EmailSettingsFormValues {
  return { to: '' };
}
