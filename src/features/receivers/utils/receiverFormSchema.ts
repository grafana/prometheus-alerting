import { t } from '@grafana/i18n';
import { z } from 'zod';

import { createDiscordIntegrationFormSchema } from '../integrations/discord/discord.schema';
import { createEmailIntegrationFormSchema } from '../integrations/email/email.schema';
import { createJiraIntegrationFormSchema } from '../integrations/jira/jira.schema';
import { createMSTeamsIntegrationFormSchema } from '../integrations/msteams/msteams.schema';
import { createOpsgenieIntegrationFormSchema } from '../integrations/opsgenie/opsgenie.schema';
import { createPagerDutyIntegrationFormSchema } from '../integrations/pagerduty/pagerduty.schema';
import { createPushoverIntegrationFormSchema } from '../integrations/pushover/pushover.schema';
import { createSlackIntegrationFormSchema } from '../integrations/slack/slack.schema';
import { createSNSIntegrationFormSchema } from '../integrations/sns/sns.schema';
import { createTelegramIntegrationFormSchema } from '../integrations/telegram/telegram.schema';
import { createVictorOpsIntegrationFormSchema } from '../integrations/victorops/victorops.schema';
import { createWeChatIntegrationFormSchema } from '../integrations/wechat/wechat.schema';
import { createWebhookIntegrationFormSchema } from '../integrations/webhook/webhook.schema';
import { createWebexIntegrationFormSchema } from '../integrations/webex/webex.schema';

export function createReceiverFormSchema() {
  return z.object({
    name: z.string().trim().min(1, t('receivers.form.name-required', 'Receiver name is required')),
    __preserved: z.record(z.string(), z.unknown()).optional(),
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
        createTelegramIntegrationFormSchema(),
        createDiscordIntegrationFormSchema(),
        createMSTeamsIntegrationFormSchema(),
        createWeChatIntegrationFormSchema(),
        createJiraIntegrationFormSchema(),
      ])
    ),
  });
}

export type ReceiverFormValues = z.infer<ReturnType<typeof createReceiverFormSchema>>;
export type IntegrationFormValues = ReceiverFormValues['integrations'][number];
