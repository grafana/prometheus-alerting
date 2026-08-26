import { t } from '@grafana/i18n';
import { z } from 'zod';

const JiraHttpConfigFormSchema = z
  .looseObject({
    authorization: z.looseObject({ type: z.string().optional(), credentials: z.string().optional() }).optional(),
    proxy_url: z.string().optional(),
    no_proxy: z.string().optional(),
    proxy_from_environment: z.boolean().optional(),
    follow_redirects: z.boolean().optional(),
    enable_http2: z.boolean().optional(),
    basic_auth: z.looseObject({ username: z.string().optional(), password: z.string().optional() }).optional(),
    tls_config: z
      .looseObject({
        server_name: z.string().optional(),
        insecure_skip_verify: z.boolean().optional(),
        min_version: z.string().optional(),
        max_version: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((httpConfig, ctx) => {
    if (httpConfig.proxy_from_environment && httpConfig.proxy_url) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.jira-proxy-conflict',
          'Proxy URL and proxy from environment cannot be used together'
        ),
        path: ['proxy_url'],
      });
    }
    if (httpConfig.authorization?.credentials && (httpConfig.basic_auth?.username || httpConfig.basic_auth?.password)) {
      ctx.addIssue({
        code: 'custom',
        message: t(
          'receivers.form.jira-authentication-conflict',
          'Authorization and basic authentication cannot be used together'
        ),
        path: ['authorization', 'credentials'],
      });
    }
  });
function createDurationSchema() {
  return z
    .string()
    .regex(
      /^((\d+(\.\d+)?)?(ms|s|m|h))+$/,
      t('receivers.form.jira-duration-invalid', 'Enter a duration such as 100ms, 1.2s, or 8h')
    )
    .or(z.literal(''))
    .optional();
}
export function createJiraSettingsFormSchema(validateRequired = true) {
  return z
    .looseObject({
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
      reopen_duration: createDurationSchema(),
      fields: z.record(z.string(), z.string()).optional(),
      http_config: JiraHttpConfigFormSchema.optional(),
    })
    .superRefine((settings, ctx) => {
      if (!validateRequired) {
        return;
      }
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
}
export function createJiraIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('jira'),
    sendResolved: z.boolean(),
    settings: createJiraSettingsFormSchema(),
  });
}
export type JiraSettingsFormValues = z.infer<ReturnType<typeof createJiraSettingsFormSchema>>;
