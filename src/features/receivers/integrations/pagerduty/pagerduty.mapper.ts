import type { PagerdutyConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createPagerDutySettingsFormSchema, PagerDutySettingsFormValues } from './pagerduty.schema';

export function pagerDutyConfigToFormSettings(config: PagerdutyConfig): PagerDutySettingsFormValues {
  return createPagerDutySettingsFormSchema().parse(structuredClone(config));
}

export function pagerDutyFormSettingsToConfig(values: PagerDutySettingsFormValues): PagerdutyConfig {
  return omitEmptyValues(createPagerDutySettingsFormSchema().parse(values));
}

export function createDefaultPagerDutySettings(): PagerDutySettingsFormValues {
  return {};
}
