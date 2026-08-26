/**
 * Utilities for transforming between Alertmanager receiver format and form values.
 */
import {
  DiscordConfigSchema,
  EmailConfigSchema,
  JiraConfigSchema,
  MSTeamsConfigSchema,
  OpsGenieConfigSchema,
  PagerdutyConfigSchema,
  PushoverConfigSchema,
  SlackConfigSchema,
  SNSConfigSchema,
  TelegramConfigSchema,
  VictorOpsConfigSchema,
  WechatConfigSchema,
  WebexConfigSchema,
  WebhookConfigSchema,
  type Receiver,
} from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultDiscordSettings,
  discordConfigToFormSettings,
  discordFormSettingsToConfig,
} from '../integrations/discord/discord.mapper';
import {
  createDefaultEmailSettings,
  emailConfigToFormSettings,
  emailFormSettingsToConfig,
} from '../integrations/email/email.mapper';
import {
  createDefaultJiraSettings,
  jiraConfigToFormSettings,
  jiraFormSettingsToConfig,
} from '../integrations/jira/jira.mapper';
import {
  createDefaultMSTeamsSettings,
  msTeamsConfigToFormSettings,
  msTeamsFormSettingsToConfig,
} from '../integrations/msteams/msteams.mapper';
import {
  createDefaultOpsgenieSettings,
  opsgenieConfigToFormSettings,
  opsgenieFormSettingsToConfig,
} from '../integrations/opsgenie/opsgenie.mapper';
import {
  createDefaultPagerDutySettings,
  pagerDutyConfigToFormSettings,
  pagerDutyFormSettingsToConfig,
} from '../integrations/pagerduty/pagerduty.mapper';
import {
  createDefaultPushoverSettings,
  pushoverConfigToFormSettings,
  pushoverFormSettingsToConfig,
} from '../integrations/pushover/pushover.mapper';
import {
  createDefaultSlackSettings,
  slackConfigToFormSettings,
  slackFormSettingsToConfig,
} from '../integrations/slack/slack.mapper';
import {
  createDefaultSNSSettings,
  snsConfigToFormSettings,
  snsFormSettingsToConfig,
} from '../integrations/sns/sns.mapper';
import {
  createDefaultTelegramSettings,
  telegramConfigToFormSettings,
  telegramFormSettingsToConfig,
} from '../integrations/telegram/telegram.mapper';
import {
  createDefaultVictorOpsSettings,
  victorOpsConfigToFormSettings,
  victorOpsFormSettingsToConfig,
} from '../integrations/victorops/victorops.mapper';
import {
  createDefaultWeChatSettings,
  weChatConfigToFormSettings,
  weChatFormSettingsToConfig,
} from '../integrations/wechat/wechat.mapper';
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
import { CLOUD_INTEGRATION_TYPES, CloudIntegrationType, INTEGRATION_TYPE_MAP } from './cloudIntegrationTypes';
import type { IntegrationFormValues, ReceiverFormValues } from './receiverFormSchema';

export { CLOUD_INTEGRATION_TYPES } from './cloudIntegrationTypes';
export type { IntegrationFormValues, ReceiverFormValues } from './receiverFormSchema';

const EDITABLE_CONFIG_KEYS = new Set<string>(Object.values(INTEGRATION_TYPE_MAP));

function getSendResolved(value: boolean | undefined, type: CloudIntegrationType): boolean {
  return value ?? (type !== 'slack' && type !== 'wechat');
}

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

        if (type === 'discord') {
          const typedConfig = DiscordConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(typedConfig.send_resolved, type),
            settings: discordConfigToFormSettings(typedConfig),
          });
          continue;
        }
        if (type === 'msteams') {
          const typedConfig = MSTeamsConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(typedConfig.send_resolved, type),
            settings: msTeamsConfigToFormSettings(typedConfig),
          });
          continue;
        }
        if (type === 'wechat') {
          const typedConfig = WechatConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(typedConfig.send_resolved, type),
            settings: weChatConfigToFormSettings(typedConfig),
          });
          continue;
        }
        if (type === 'jira') {
          const typedConfig = JiraConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(typedConfig.send_resolved, type),
            settings: jiraConfigToFormSettings(typedConfig),
          });
          continue;
        }
        if (type === 'opsgenie') {
          const opsgenieConfig = OpsGenieConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(opsgenieConfig.send_resolved, type),
            settings: opsgenieConfigToFormSettings(opsgenieConfig),
          });
          continue;
        }
        if (type === 'pushover') {
          const pushoverConfig = PushoverConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(pushoverConfig.send_resolved, type),
            settings: pushoverConfigToFormSettings(pushoverConfig),
          });
          continue;
        }
        if (type === 'victorops') {
          const victorOpsConfig = VictorOpsConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(victorOpsConfig.send_resolved, type),
            settings: victorOpsConfigToFormSettings(victorOpsConfig),
          });
          continue;
        }
        if (type === 'telegram') {
          const telegramConfig = TelegramConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(telegramConfig.send_resolved, type),
            settings: telegramConfigToFormSettings(telegramConfig),
          });
          continue;
        }
        if (type === 'slack') {
          const slackConfig = SlackConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(slackConfig.send_resolved, type),
            settings: slackConfigToFormSettings(slackConfig),
          });
          continue;
        }
        if (type === 'email') {
          const emailConfig = EmailConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(emailConfig.send_resolved, type),
            settings: emailConfigToFormSettings(emailConfig),
          });
          continue;
        }
        if (type === 'sns') {
          const snsConfig = SNSConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(snsConfig.send_resolved, type),
            settings: snsConfigToFormSettings(snsConfig),
          });
          continue;
        }
        if (type === 'pagerduty') {
          const pagerDutyConfig = PagerdutyConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(pagerDutyConfig.send_resolved, type),
            settings: pagerDutyConfigToFormSettings(pagerDutyConfig),
          });
          continue;
        }
        if (type === 'webhook') {
          const webhookConfig = WebhookConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(webhookConfig.send_resolved, type),
            settings: webhookConfigToFormSettings(webhookConfig),
          });
          continue;
        }
        if (type === 'webex') {
          const webexConfig = WebexConfigSchema.parse(config);
          integrations.push({
            __id: id,
            type,
            sendResolved: getSendResolved(webexConfig.send_resolved, type),
            settings: webexConfigToFormSettings(webexConfig),
          });
          continue;
        }
      }
    }
  }

  const preservedEntries = Object.entries(receiver).filter(([key]) => key !== 'name' && !EDITABLE_CONFIG_KEYS.has(key));

  return {
    name: receiver.name,
    __preserved: structuredClone(Object.fromEntries(preservedEntries)),
    integrations,
  };
}

/**
 * Convert form values back to a receiver object
 */
export function formValuesToReceiver(values: ReceiverFormValues): Receiver {
  const receiver: Receiver = {
    ...structuredClone(values.__preserved ?? {}),
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

    if (integration.type === 'discord') {
      const config = discordFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'msteams') {
      const config = msTeamsFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'wechat') {
      const config = weChatFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'jira') {
      const config = jiraFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'opsgenie') {
      const config = opsgenieFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'pushover') {
      const config = pushoverFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'victorops') {
      const config = victorOpsFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'telegram') {
      const config = telegramFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...config,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'slack') {
      const slackConfig = slackFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...slackConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'email') {
      const emailConfig = emailFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...emailConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'sns') {
      const snsConfig = snsFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...snsConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'pagerduty') {
      const pagerDutyConfig = pagerDutyFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...pagerDutyConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'webhook') {
      const webhookConfig = webhookFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...webhookConfig,
        send_resolved: integration.sendResolved,
      });
      continue;
    }
    if (integration.type === 'webex') {
      const webexConfig = webexFormSettingsToConfig(integration.settings);
      (receiver[configKey] as Array<Record<string, unknown>>).push({
        ...webexConfig,
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
  if (type === 'discord') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultDiscordSettings() };
  }
  if (type === 'msteams') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultMSTeamsSettings() };
  }
  if (type === 'wechat') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultWeChatSettings() };
  }
  if (type === 'jira') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultJiraSettings() };
  }
  if (type === 'opsgenie') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultOpsgenieSettings() };
  }
  if (type === 'pushover') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultPushoverSettings() };
  }
  if (type === 'victorops') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultVictorOpsSettings() };
  }
  if (type === 'telegram') {
    return { __id: generateId(), type, sendResolved: true, settings: createDefaultTelegramSettings() };
  }
  if (type === 'slack') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultSlackSettings(),
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
  if (type === 'sns') {
    return {
      __id: generateId(),
      type,
      sendResolved: true,
      settings: createDefaultSNSSettings(),
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

  throw new Error('Unsupported receiver integration type');
}

/**
 * Validate that a receiver name is not a duplicate
 */
export function isReceiverNameUnique(name: string, existingReceivers: Receiver[], originalName?: string): boolean {
  return !existingReceivers.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.name !== originalName);
}
