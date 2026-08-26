import type { WebexConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createWebexSettingsFormSchema, WebexSettingsFormValues } from './webex.schema';

export function webexConfigToFormSettings(config: WebexConfig): WebexSettingsFormValues {
  const settings = structuredClone(config);
  const { bearer_token: legacyBearerTokenValue, ...httpConfig } = settings.http_config ?? {};
  const legacyBearerToken = typeof legacyBearerTokenValue === 'string' ? legacyBearerTokenValue : undefined;
  const authorizationCredentials = httpConfig.authorization?.credentials ?? legacyBearerToken;

  const normalizedHttpConfig = {
    ...httpConfig,
    authorization: {
      ...httpConfig.authorization,
      type: httpConfig.authorization?.type ?? (authorizationCredentials ? 'Bearer' : undefined),
      credentials: authorizationCredentials,
    },
  };

  settings.room_id ??= '';
  settings.http_config = normalizedHttpConfig;

  return createWebexSettingsFormSchema(false).parse(settings);
}

export function webexFormSettingsToConfig(values: WebexSettingsFormValues): WebexConfig {
  return omitEmptyValues(createWebexSettingsFormSchema(false).parse(values));
}

export function createDefaultWebexSettings(): WebexSettingsFormValues {
  return {
    room_id: '',
    http_config: { authorization: {} },
  };
}
