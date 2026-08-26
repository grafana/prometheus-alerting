/**
 * Utilities for transforming between Alertmanager receiver format and form values.
 */
import {
  WebhookConfigSchema,
  WebexConfigSchema,
  PagerdutyConfigSchema,
  SNSConfigSchema,
  EmailConfigSchema,
  SlackConfigSchema,
  OpsGenieConfigSchema,
  PushoverConfigSchema,
  VictorOpsConfigSchema,
  TelegramConfigSchema,
  DiscordConfigSchema,
  MSTeamsConfigSchema,
  WechatConfigSchema,
  JiraConfigSchema,
  type Receiver,
} from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultWebhookSettings,
  webhookConfigToFormSettings,
  webhookFormSettingsToConfig,
} from '../integrations/webhook/webhook.mapper';
import {
  createDefaultWebexSettings,
  webexConfigToFormSettings,
  webexFormSettingsToConfig,
} from '../integrations/webex/webex.mapper';
import {
  createDefaultPagerDutySettings,
  pagerDutyConfigToFormSettings,
  pagerDutyFormSettingsToConfig,
} from '../integrations/pagerduty/pagerduty.mapper';
import {
  createDefaultSNSSettings,
  snsConfigToFormSettings,
  snsFormSettingsToConfig,
} from '../integrations/sns/sns.mapper';
import {
  createDefaultEmailSettings,
  emailConfigToFormSettings,
  emailFormSettingsToConfig,
} from '../integrations/email/email.mapper';
import {
  createDefaultSlackSettings,
  slackConfigToFormSettings,
  slackFormSettingsToConfig,
} from '../integrations/slack/slack.mapper';
import {
  createDefaultOpsgenieSettings,
  opsgenieConfigToFormSettings,
  opsgenieFormSettingsToConfig,
} from '../integrations/opsgenie/opsgenie.mapper';
import {
  createDefaultPushoverSettings,
  pushoverConfigToFormSettings,
  pushoverFormSettingsToConfig,
} from '../integrations/pushover/pushover.mapper';
import {
  createDefaultVictorOpsSettings,
  victorOpsConfigToFormSettings,
  victorOpsFormSettingsToConfig,
} from '../integrations/victorops/victorops.mapper';
import {
  createDefaultTelegramSettings,
  telegramConfigToFormSettings,
  telegramFormSettingsToConfig,
} from '../integrations/telegram/telegram.mapper';
import {
  createDefaultDiscordSettings,
  discordConfigToFormSettings,
  discordFormSettingsToConfig,
} from '../integrations/discord/discord.mapper';
import {
  createDefaultMSTeamsSettings,
  msTeamsConfigToFormSettings,
  msTeamsFormSettingsToConfig,
} from '../integrations/msteams/msteams.mapper';
import {
  createDefaultWeChatSettings,
  weChatConfigToFormSettings,
  weChatFormSettingsToConfig,
} from '../integrations/wechat/wechat.mapper';
import {
  createDefaultJiraSettings,
  jiraConfigToFormSettings,
  jiraFormSettingsToConfig,
} from '../integrations/jira/jira.mapper';
import { CLOUD_INTEGRATION_TYPES, CloudIntegrationType, INTEGRATION_TYPE_MAP } from './cloudIntegrationTypes';
import type { IntegrationFormValues, ReceiverFormValues } from './receiverFormSchema';

export { CLOUD_INTEGRATION_TYPES } from './cloudIntegrationTypes';
export type { IntegrationFormValues, ReceiverFormValues } from './receiverFormSchema';

/**
 * Generate a unique ID for form items
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Get the config key for a given integration type
 */
export function getConfigKeyForType(type: CloudIntegrationType): (typeof INTEGRATION_TYPE_MAP)[CloudIntegrationType] {
  return INTEGRATION_TYPE_MAP[type];
}

/**
 * Extract integrations from a receiver into form values
 */
export function receiverToFormValues(receiver: Receiver): ReceiverFormValues {
  const integrations: IntegrationFormValues[] = [];

  for (const type of CLOUD_INTEGRATION_TYPES) {
    const configKey = INTEGRATION_TYPE_MAP[type];
    const configs = receiver[configKey];
    if (configs && Array.isArray(configs)) {
      for (const config of configs) {
        const id = generateId();

        if (type === 'webhook') {
          const typedConfig = WebhookConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: webhookConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'webex') {
          const typedConfig = WebexConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: webexConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'pagerduty') {
          const typedConfig = PagerdutyConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: pagerDutyConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'sns') {
          const typedConfig = SNSConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: snsConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'email') {
          const typedConfig = EmailConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: emailConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'slack') {
          const typedConfig = SlackConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: slackConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'opsgenie') {
          const typedConfig = OpsGenieConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: opsgenieConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'pushover') {
          const typedConfig = PushoverConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: pushoverConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'victorops') {
          const typedConfig = VictorOpsConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: victorOpsConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'telegram') {
          const typedConfig = TelegramConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: telegramConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'discord') {
          const typedConfig = DiscordConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: discordConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'msteams') {
          const typedConfig = MSTeamsConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: msTeamsConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'wechat') {
          const typedConfig = WechatConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: weChatConfigToFormSettings(typedConfig),
          });
          continue;
        }

        if (type === 'jira') {
          const typedConfig = JiraConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: typedConfig.send_resolved !== false,
            settings: jiraConfigToFormSettings(typedConfig),
          });
          continue;
        }
      }
    }
  }

  return {
    name: receiver.name,
    integrations,
  };
}

/**
 * Convert form values back to a receiver object
 */
export function formValuesToReceiver(values: ReceiverFormValues): Receiver {
  const receiver: Receiver = {
    name: values.name,
  };

  // Group integrations by type
  for (const integration of values.integrations) {
    // Skip deleted integrations
    if (integration.__deleted) {
      continue;
    }

    const configKey = getConfigKeyForType(integration.type);

    // Initialize the config array if needed
    if (!receiver[configKey]) {
      // Type assertion needed due to dynamic key
      (receiver as Record<string, unknown>)[configKey] = [];
    }

    if (integration.type === 'webhook') {
      const typedConfig = webhookFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'webex') {
      const typedConfig = webexFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'pagerduty') {
      const typedConfig = pagerDutyFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'sns') {
      const typedConfig = snsFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'email') {
      const typedConfig = emailFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'slack') {
      const typedConfig = slackFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'opsgenie') {
      const typedConfig = opsgenieFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'pushover') {
      const typedConfig = pushoverFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'victorops') {
      const typedConfig = victorOpsFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'telegram') {
      const typedConfig = telegramFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'discord') {
      const typedConfig = discordFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'msteams') {
      const typedConfig = msTeamsFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'wechat') {
      const typedConfig = weChatFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }

    if (integration.type === 'jira') {
      const typedConfig = jiraFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...typedConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
  }

  return receiver;
}

/**
 * Create default form values for a new receiver
 */
export function createDefaultReceiverFormValues(): ReceiverFormValues {
  return {
    name: '',
    integrations: [createDefaultIntegration('webhook')],
  };
}

/**
 * Create a new integration with default values for a given type
 */
export function createDefaultIntegration(type: CloudIntegrationType): IntegrationFormValues {
  if (type === 'webhook') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultWebhookSettings(),
    };
  }

  if (type === 'webex') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultWebexSettings(),
    };
  }

  if (type === 'pagerduty') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultPagerDutySettings(),
    };
  }

  if (type === 'sns') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultSNSSettings(),
    };
  }

  if (type === 'email') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultEmailSettings(),
    };
  }

  if (type === 'slack') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultSlackSettings(),
    };
  }

  if (type === 'opsgenie') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultOpsgenieSettings(),
    };
  }

  if (type === 'pushover') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultPushoverSettings(),
    };
  }

  if (type === 'victorops') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultVictorOpsSettings(),
    };
  }

  if (type === 'telegram') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultTelegramSettings(),
    };
  }

  if (type === 'discord') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultDiscordSettings(),
    };
  }

  if (type === 'msteams') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultMSTeamsSettings(),
    };
  }

  if (type === 'wechat') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultWeChatSettings(),
    };
  }

  if (type === 'jira') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultJiraSettings(),
    };
  }

  throw new Error('Unsupported receiver integration type');
}

/**
 * Validate that a receiver name is not a duplicate
 */
export function isReceiverNameUnique(name: string, existingReceivers: Receiver[], originalName?: string): boolean {
  return !existingReceivers.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.name !== originalName);
}
