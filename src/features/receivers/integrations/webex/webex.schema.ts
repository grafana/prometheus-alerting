import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';

// Webex can't post anything without credentials, so it adds a "must be filled in" check on top of
// the HTTP settings every integration shares.
function createWebexHttpConfigFormSchema(validateForSubmission: boolean) {
  return createHttpConfigFormSchema().superRefine((httpConfig, ctx) => {
    const authorizationIsConfigured = Boolean(
      httpConfig.authorization?.credentials || httpConfig.authorization?.credentials_file
    );

    if (validateForSubmission && !authorizationIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.webex-authorization-required', 'Webex authorization credentials are required'),
        path: ['authorization', 'credentials'],
      });
    }
  });
}

export function createWebexSettingsFormSchema(validateForSubmission = true) {
  return z.looseObject({
    api_url: z.string().optional(),
    room_id: z.string().trim().min(1, t('receivers.form.webex-room-id-required', 'Room ID is required')),
    message: z.string().optional(),
    http_config: createWebexHttpConfigFormSchema(validateForSubmission),
  });
}

export function createWebexIntegrationFormSchema() {
  return z.object({
    __id: z.string(),
    __deleted: z.boolean().optional(),
    type: z.literal('webex'),
    sendResolved: z.boolean(),
    settings: createWebexSettingsFormSchema(),
  });
}

export type WebexSettingsFormValues = z.infer<ReturnType<typeof createWebexSettingsFormSchema>>;
