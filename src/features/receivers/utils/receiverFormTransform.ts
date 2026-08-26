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
import { cloudNotifierTypes, NotifierDTO } from './notifierTypes';
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

        const { send_resolved, ...settings } = config;
        integrations.push({
          __id: id,
          type,
          sendResolved: send_resolved !== false,
          settings,
        });
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

    const config: Record<string, unknown> = {
      send_resolved: integration.sendResolved,
    };

    for (const [key, value] of Object.entries(integration.settings)) {
      if (value !== '' && value !== null && value !== undefined) {
        if (isRecord(value)) {
          const cleanedNested = cleanEmptyValues(value);
          if (Object.keys(cleanedNested).length > 0) {
            config[key] = cleanedNested;
          }
        } else {
          config[key] = value;
        }
      }
    }

    (receiver[configKey] as Array<Record<string, unknown>>).push(config);
  }

  return receiver;
}

/**
 * Remove empty values from an object recursively
 */
function cleanEmptyValues(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === null || value === undefined) {
      continue;
    }

    if (isRecord(value)) {
      const cleanedNested = cleanEmptyValues(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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

  const notifier = cloudNotifierTypes.find((n) => n.type === type);
  return {
    __id: generateId(),
    type,
    sendResolved: true,
    settings: notifier ? createDefaultSettings(notifier.options) : {},
  };
}

function createDefaultSettings(options: NotifierDTO['options']): Record<string, unknown> {
  const settings: Record<string, unknown> = {};

  for (const option of options) {
    if (option.element === 'subform' && option.subformOptions) {
      const nestedSettings = createDefaultSettings(option.subformOptions);
      if (Object.keys(nestedSettings).length > 0) {
        settings[option.propertyName] = nestedSettings;
      }
      continue;
    }

    if (option.defaultValue !== undefined) {
      settings[option.propertyName] = option.defaultValue;
    }
  }

  return settings;
}

/**
 * Get the notifier definition for a type
 */
export function getNotifierForType(type: CloudIntegrationType): NotifierDTO | undefined {
  return cloudNotifierTypes.find((n) => n.type === type);
}

/**
 * Validate that a receiver name is not a duplicate
 */
export function isReceiverNameUnique(name: string, existingReceivers: Receiver[], originalName?: string): boolean {
  return !existingReceivers.some((r) => r.name.toLowerCase() === name.toLowerCase() && r.name !== originalName);
}
