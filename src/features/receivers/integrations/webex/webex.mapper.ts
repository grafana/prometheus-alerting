import type { WebexConfig } from '@grafana/external-alertmanager/vanilla';

import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createWebexSettingsSchema, WebexSettingsFormValues } from './webex.schema';

export function webexConfigToFormSettings(config: WebexConfig): WebexSettingsFormValues {
  const settings = structuredClone(config);
  const {
    bearer_token: legacyBearerToken,
    bearer_token_file: legacyBearerTokenFile,
    ...httpConfig
  } = settings.http_config ?? {};
  const legacyAuthorization = legacyBearerToken
    ? { type: 'Bearer', credentials: legacyBearerToken }
    : legacyBearerTokenFile
      ? { type: 'Bearer', credentials_file: legacyBearerTokenFile }
      : undefined;

  const normalizedHttpConfig = {
    ...httpConfig,
    authorization: httpConfig.authorization ?? legacyAuthorization ?? {},
  };

  settings.room_id ??= '';
  settings.http_config = normalizedHttpConfig;

  return createWebexSettingsSchema().parse(settings);
}

export function webexFormSettingsToConfig(values: WebexSettingsFormValues): WebexConfig {
  return omitEmptyValues(createWebexSettingsSchema().parse(values));
}

export function createDefaultWebexSettings(): WebexSettingsFormValues {
  return {
    room_id: '',
    http_config: { authorization: {} },
  };
}
