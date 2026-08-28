import type { JiraConfig } from '@grafana/external-alertmanager/vanilla';
import { createDefaultJiraSettings, jiraConfigToFormSettings, jiraFormSettingsToConfig } from './jira.mapper';
import { JiraSettingsFormSchema } from './jira.schema';
describe('Jira mapper', () => {
  it('round-trips collections, HTTP, and unknown fields', () => {
    const config = {
      api_url: 'https://jira.example',
      project: 'OPS',
      issue_type: 'Bug',
      labels: ['alert'],
      fields: { environment: 'prod' },
      http_config: { follow_redirects: false },
      future_option: 'keep',
    } satisfies JiraConfig;
    expect(jiraFormSettingsToConfig(jiraConfigToFormSettings(config))).toEqual(config);
  });
  it('requires API URL, project, and issue type', () => {
    const result = JiraSettingsFormSchema.safeParse(createDefaultJiraSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['api_url'], ['project'], ['issue_type']])
      );
    }
  });
  it('rejects invalid reopen duration', () => {
    const settings = {
      ...createDefaultJiraSettings(),
      api_url: 'https://jira.example',
      project: 'OPS',
      issue_type: 'Bug',
      reopen_duration: 'tomorrow',
    };
    expect(JiraSettingsFormSchema.safeParse(settings).success).toBe(false);
  });
});
