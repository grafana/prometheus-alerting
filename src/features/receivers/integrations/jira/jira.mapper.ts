import type { JiraConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { JiraSettingsSchema, JiraSettingsFormValues } from './jira.schema';
export function jiraConfigToFormSettings(config: JiraConfig): JiraSettingsFormValues {
  const settings = structuredClone(config);
  settings.api_url ??= '';
  settings.issue_type ??= '';
  return JiraSettingsSchema.parse(settings);
}
export function jiraFormSettingsToConfig(values: JiraSettingsFormValues): JiraConfig {
  return omitEmptyValues(JiraSettingsSchema.parse(values));
}
export function createDefaultJiraSettings(): JiraSettingsFormValues {
  return { api_url: '', project: '', issue_type: '', http_config: {} };
}
