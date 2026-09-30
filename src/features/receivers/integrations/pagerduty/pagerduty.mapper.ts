import type { PagerdutyConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { PagerDutySettingsSchema, PagerDutySettingsFormValues } from './pagerduty.schema';

export function pagerDutyConfigToFormSettings(config: PagerdutyConfig): PagerDutySettingsFormValues {
  return PagerDutySettingsSchema.parse(structuredClone(config));
}

export function pagerDutyFormSettingsToConfig(values: PagerDutySettingsFormValues): PagerdutyConfig {
  return omitEmptyValues(PagerDutySettingsSchema.parse(values));
}

export function createDefaultPagerDutySettings(): PagerDutySettingsFormValues {
  return {};
}
