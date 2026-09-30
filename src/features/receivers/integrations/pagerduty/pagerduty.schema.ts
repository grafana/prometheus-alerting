import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';

export const PagerDutySettingsSchema = z.looseObject({
  routing_key: z.string().optional(),
  service_key: z.string().optional(),
  url: z.string().optional(),
  client: z.string().optional(),
  client_url: z.string().optional(),
  description: z.string().optional(),
  severity: z.string().optional(),
  class: z.string().optional(),
  component: z.string().optional(),
  group: z.string().optional(),
  source: z.string().optional(),
  details: z.record(z.string(), z.string()).optional(),
  images: z
    .array(
      z.looseObject({
        src: z.string().optional(),
        href: z.string().optional(),
        alt: z.string().optional(),
      })
    )
    .optional(),
  links: z
    .array(
      z.looseObject({
        href: z.string().optional(),
        text: z.string().optional(),
      })
    )
    .optional(),
  http_config: createHttpConfigFormSchema().optional(),
});

export const PagerDutySettingsFormSchema = PagerDutySettingsSchema.superRefine((settings, ctx) => {
  // PagerDuty has two ways in: an Events API v2 routing key, or a legacy service key. The
  // API refuses a receiver that has neither, so say so on the field people usually fill in.
  if (!settings.routing_key?.trim() && !settings.service_key?.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: t('receivers.form.pagerduty-key-required', 'Routing key or service key is required'),
      path: ['routing_key'],
    });
  }
});

export function createPagerDutyIntegrationFormSchema() {
  return createIntegrationFormSchema('pagerduty', PagerDutySettingsFormSchema, [
    {
      name: 'url',
      message: t('receivers.form.pagerduty-url-invalid', 'URL must start with http:// or https://'),
    },
  ]);
}

export type PagerDutySettingsFormValues = z.infer<typeof PagerDutySettingsSchema>;
