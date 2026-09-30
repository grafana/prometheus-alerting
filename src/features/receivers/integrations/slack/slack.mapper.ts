import type { SlackConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createSlackSettingsSchema, SlackSettingsFormValues } from './slack.schema';

export function slackConfigToFormSettings(config: SlackConfig): SlackSettingsFormValues {
  const settings = structuredClone(config);
  settings.channel ??= '';
  return createSlackSettingsSchema().parse(settings);
}

export function slackFormSettingsToConfig(values: SlackSettingsFormValues): SlackConfig {
  return omitEmptyValues(createSlackSettingsSchema().parse(values));
}

export function createDefaultSlackSettings(): SlackSettingsFormValues {
  return { channel: '' };
}
