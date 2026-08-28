import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';

// Webex can't post anything without credentials, so it adds a "must be filled in" check on top of
// the HTTP settings every integration shares.
function createWebexHttpConfigFormSchema() {
  return createHttpConfigFormSchema().superRefine((httpConfig, ctx) => {
    const authorizationIsConfigured = Boolean(
      httpConfig.authorization?.credentials || httpConfig.authorization?.credentials_file
    );

    if (!authorizationIsConfigured) {
      ctx.addIssue({
        code: 'custom',
        message: t('receivers.form.webex-authorization-required', 'Webex authorization credentials are required'),
        path: ['authorization', 'credentials'],
      });
    }
  });
}

export function createWebexSettingsSchema() {
  return z.looseObject({
    api_url: z.string().optional(),
    room_id: z.string().trim().min(1, t('receivers.form.webex-room-id-required', 'Room ID is required')),
    message: z.string().optional(),
    http_config: createHttpConfigFormSchema(),
  });
}

export function createWebexSettingsFormSchema() {
  return createWebexSettingsSchema().safeExtend({
    http_config: createWebexHttpConfigFormSchema(),
  });
}

export function createWebexIntegrationFormSchema() {
  return createIntegrationFormSchema('webex', createWebexSettingsFormSchema(), [
    {
      name: 'api_url',
      message: t('receivers.form.webex-api-url-invalid', 'API URL must start with http:// or https://'),
    },
  ]);
}

export type WebexSettingsFormValues = z.infer<ReturnType<typeof createWebexSettingsSchema>>;
