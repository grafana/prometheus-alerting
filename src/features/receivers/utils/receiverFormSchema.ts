import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createWebhookIntegrationFormSchema } from '../integrations/webhook/webhook.schema';
import { createWebexIntegrationFormSchema } from '../integrations/webex/webex.schema';
import { createPagerDutyIntegrationFormSchema } from '../integrations/pagerduty/pagerduty.schema';
import { createSNSIntegrationFormSchema } from '../integrations/sns/sns.schema';
import { createEmailIntegrationFormSchema } from '../integrations/email/email.schema';
import { createSlackIntegrationFormSchema } from '../integrations/slack/slack.schema';
import { createOpsgenieIntegrationFormSchema } from '../integrations/opsgenie/opsgenie.schema';
import { createPushoverIntegrationFormSchema } from '../integrations/pushover/pushover.schema';
import { createVictorOpsIntegrationFormSchema } from '../integrations/victorops/victorops.schema';
import { LEGACY_INTEGRATION_TYPES } from './cloudIntegrationTypes';

const LegacyIntegrationFormSchema = z.object({
  __id: z.string(),
  __deleted: z.boolean().optional(),
  type: z.enum(LEGACY_INTEGRATION_TYPES),
  sendResolved: z.boolean(),
  settings: z.record(z.string(), z.unknown()),
});

export function createReceiverFormSchema() {
  return z.object({
    name: z.string().trim().min(1, t('receivers.form.name-required', 'Receiver name is required')),
    integrations: z.array(
      z.discriminatedUnion('type', [
        createWebhookIntegrationFormSchema(),
        createWebexIntegrationFormSchema(),
        createPagerDutyIntegrationFormSchema(),
        createSNSIntegrationFormSchema(),
        createEmailIntegrationFormSchema(),
        createSlackIntegrationFormSchema(),
        createOpsgenieIntegrationFormSchema(),
        createPushoverIntegrationFormSchema(),
        createVictorOpsIntegrationFormSchema(),
        LegacyIntegrationFormSchema,
      ])
    ),
  });
}

export type ReceiverFormValues = z.infer<ReturnType<typeof createReceiverFormSchema>>;
export type IntegrationFormValues = ReceiverFormValues['integrations'][number];
