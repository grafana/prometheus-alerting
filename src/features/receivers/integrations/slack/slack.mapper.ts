import type { SlackConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createSlackSettingsFormSchema, SlackSettingsFormValues } from './slack.schema';

export function slackConfigToFormSettings(config: SlackConfig): SlackSettingsFormValues {
  const settings = structuredClone(config);
  settings.channel ??= '';
  return createSlackSettingsFormSchema(false).parse(settings);
}

export function slackFormSettingsToConfig(values: SlackSettingsFormValues): SlackConfig {
  return omitEmptyValues(createSlackSettingsFormSchema(false).parse(values));
}

export function createDefaultSlackSettings(): SlackSettingsFormValues {
  return { channel: '' };
}
