import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';
import { inlineOrFileFields } from '../shared/inlineOrFile.schema';

/** Names VictorOps fills in itself, so a custom field cannot reuse them. */
const VICTOROPS_RESERVED_FIELDS = [
  'routing_key',
  'message_type',
  'state_message',
  'entity_display_name',
  'monitoring_tool',
  'entity_id',
  'entity_state',
];

export function createVictorOpsSettingsSchema() {
  return inlineOrFileFields({
    inline: 'api_key',
    file: 'api_key_file',
    conflict: t('receivers.form.victorops-api-key-conflict', 'API key and API key file cannot be used together'),
  })
    .safeExtend({
      api_url: z.string().optional(),
      routing_key: z
        .string()
        .trim()
        .min(1, t('receivers.form.victorops-routing-key-required', 'Routing key is required')),
      message_type: z.string().optional(),
      entity_display_name: z.string().optional(),
      state_message: z.string().optional(),
      monitoring_tool: z.string().optional(),
      custom_fields: z.record(z.string(), z.string()).optional(),
      http_config: createHttpConfigFormSchema().optional(),
    })
    .superRefine((settings, ctx) => {
      // VictorOps sends these keys itself, so a custom field using one of their names collides
      // with the value it already puts in the payload and the config is turned away.
      Object.keys(settings.custom_fields ?? {}).forEach((field) => {
        if (VICTOROPS_RESERVED_FIELDS.includes(field)) {
          ctx.addIssue({
            code: 'custom',
            message: t(
              'receivers.form.victorops-custom-field-reserved',
              'Custom fields cannot use a name VictorOps already sends'
            ),
            path: ['custom_fields'],
          });
        }
      });
    });
}

export function createVictorOpsSettingsFormSchema() {
  return createVictorOpsSettingsSchema().superRefine((settings, ctx) => {
    if (!settings.api_key?.trim() && !settings.api_key_file?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.victorops-api-key-required', 'API key is required'),
        path: ['api_key'],
      });
    }

    if (
      settings.message_type &&
      !['CRITICAL', 'WARNING', 'INFO'].includes(settings.message_type) &&
      !settings.message_type.includes('{{')
    ) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.victorops-message-type-invalid', 'Message type must be CRITICAL, WARNING, or INFO'),
        path: ['message_type'],
      });
    }
  });
}
export function createVictorOpsIntegrationFormSchema() {
  return createIntegrationFormSchema('victorops', createVictorOpsSettingsFormSchema(), [
    {
      name: 'api_url',
      message: t('receivers.form.victorops-api-url-invalid', 'API URL must start with http:// or https://'),
    },
  ]);
}
export type VictorOpsSettingsFormValues = z.infer<ReturnType<typeof createVictorOpsSettingsSchema>>;
