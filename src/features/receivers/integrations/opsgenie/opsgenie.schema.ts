import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

const OpsgenieResponderFormSchema = z.looseObject({
  id: z.string().optional(),
  name: z.string().optional(),
  username: z.string().optional(),
  type: z.string().optional(),
});

export function createOpsgenieSettingsFormSchema(validateRequired = true) {
  return inlineOrFileFields({
    inline: 'api_key',
    file: 'api_key_file',
    required: validateRequired ? t('receivers.form.opsgenie-api-key-required', 'API key is required') : undefined,
    conflict: t('receivers.form.opsgenie-api-key-conflict', 'API key and API key file cannot be used together'),
  })
    .safeExtend({
      api_url: z.string().optional(),
      message: z
        .string()
        .max(130, t('receivers.form.opsgenie-message-too-long', 'Message must be at most 130 characters'))
        .optional(),
      description: z.string().optional(),
      source: z.string().optional(),
      details: z.record(z.string(), z.string()).optional(),
      responders: z.array(OpsgenieResponderFormSchema).optional(),
      tags: z.string().optional(),
      note: z.string().optional(),
      priority: z.string().optional(),
      entity: z.string().optional(),
      actions: z.string().optional(),
      update_alerts: z.boolean().optional(),
      http_config: createHttpConfigFormSchema().optional(),
    })
    .superRefine((settings, ctx) => {
      if (
        validateRequired &&
        settings.priority &&
        !/^P[1-5]$/.test(settings.priority) &&
        !settings.priority.includes('{{')
      ) {
        ctx.addIssue({
          code: 'custom',
          message: t('receivers.form.opsgenie-priority-invalid', 'Priority must be P1, P2, P3, P4, or P5'),
          path: ['priority'],
        });
      }
    });
}
export function createOpsgenieIntegrationFormSchema() {
  return createIntegrationFormSchema('opsgenie', createOpsgenieSettingsFormSchema(), [
    {
      name: 'api_url',
      message: t('receivers.form.opsgenie-api-url-invalid', 'API URL must start with http:// or https://'),
    },
  ]);
}
export type OpsgenieSettingsFormValues = z.infer<ReturnType<typeof createOpsgenieSettingsFormSchema>>;
