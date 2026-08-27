import type { JiraConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createJiraSettingsFormSchema, JiraSettingsFormValues } from './jira.schema';
export function jiraConfigToFormSettings(config: JiraConfig): JiraSettingsFormValues {
  const settings = structuredClone(config);
  settings.api_url ??= '';
  settings.issue_type ??= '';
  return createJiraSettingsFormSchema(false).parse(settings);
}
export function jiraFormSettingsToConfig(values: JiraSettingsFormValues): JiraConfig {
  return omitEmptyValues(createJiraSettingsFormSchema(false).parse(values));
}
export function createDefaultJiraSettings(): JiraSettingsFormValues {
  return { api_url: '', project: '', issue_type: '', http_config: {} };
}
