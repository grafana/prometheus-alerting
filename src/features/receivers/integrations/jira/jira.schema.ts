import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { prometheusDurationSchema } from '../shared/duration.schema';

export const JiraSettingsSchema = z.looseObject({
  api_url: z.string().optional(),
  api_type: z.string().optional(),
  project: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  labels: z.array(z.string()).optional(),
  priority: z.string().optional(),
  issue_type: z.string().optional(),
  resolve_transition: z.string().optional(),
  reopen_transition: z.string().optional(),
  wont_fix_resolution: z.string().optional(),
  reopen_duration: prometheusDurationSchema,
  fields: z.record(z.string(), z.string()).optional(),
  http_config: createHttpConfigFormSchema().optional(),
});

export const JiraSettingsFormSchema = JiraSettingsSchema.superRefine((settings, ctx) => {
  const requiredFields = [
    ['api_url', settings.api_url, t('receivers.form.jira-api-url-required', 'API URL is required')],
    ['project', settings.project, t('receivers.form.jira-project-required', 'Project key is required')],
    ['issue_type', settings.issue_type, t('receivers.form.jira-issue-type-required', 'Issue type is required')],
  ] as const;
  for (const [path, value, message] of requiredFields) {
    if (!value?.trim()) {
      ctx.addIssue({ code: 'custom', message, path: [path] });
    }
  }
});
export function createJiraIntegrationFormSchema() {
  return createIntegrationFormSchema('jira', JiraSettingsFormSchema, [
    {
      name: 'api_url',
      message: t('receivers.form.jira-api-url-invalid', 'API URL must start with http:// or https://'),
    },
  ]);
}
export type JiraSettingsFormValues = z.infer<typeof JiraSettingsSchema>;
