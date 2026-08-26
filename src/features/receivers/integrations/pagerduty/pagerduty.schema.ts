import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createIntegrationFormSchema } from '../shared/integration.schema';
import { createHttpConfigFormSchema } from '../shared/httpConfig.schema';

export function createPagerDutySettingsFormSchema() {
  return z.looseObject({
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
}

export function createPagerDutyIntegrationFormSchema() {
  return createIntegrationFormSchema('pagerduty', createPagerDutySettingsFormSchema(), [
    {
      name: 'url',
      message: t('receivers.form.pagerduty-url-invalid', 'URL must start with http:// or https://'),
    },
  ]);
}

export type PagerDutySettingsFormValues = z.infer<ReturnType<typeof createPagerDutySettingsFormSchema>>;
