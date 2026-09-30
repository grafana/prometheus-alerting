import type { WebhookConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createWebhookSettingsFormSchema, WebhookSettingsFormValues } from './webhook.schema';

export function webhookConfigToFormSettings(config: WebhookConfig): WebhookSettingsFormValues {
  const clonedConfig = structuredClone(config);
  const {
    bearer_token: legacyBearerToken,
    bearer_token_file: legacyBearerTokenFile,
    ...httpConfig
  } = clonedConfig.http_config ?? {};
  const legacyAuthorization = legacyBearerToken
    ? { type: 'Bearer', credentials: legacyBearerToken }
    : legacyBearerTokenFile
      ? { type: 'Bearer', credentials_file: legacyBearerTokenFile }
      : undefined;
  const authorization = httpConfig.authorization ?? legacyAuthorization;

  return createWebhookSettingsFormSchema().parse({
    ...clonedConfig,
    url: clonedConfig.url ?? '',
    max_alerts: clonedConfig.max_alerts?.toString() ?? '',
    http_config: {
      ...httpConfig,
      authorization,
    },
  });
}

export function webhookFormSettingsToConfig(values: WebhookSettingsFormValues): WebhookConfig {
  const parsed = createWebhookSettingsFormSchema().parse(values);
  return omitEmptyValues({
    ...parsed,
    max_alerts: parsed.max_alerts === '' ? undefined : Number(parsed.max_alerts),
  });
}

export function createDefaultWebhookSettings(): WebhookSettingsFormValues {
  return {
    url: '',
    max_alerts: '',
    http_config: {},
  };
}
