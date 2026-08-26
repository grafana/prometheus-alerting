import type { WechatConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { createWeChatSettingsFormSchema, WeChatSettingsFormValues } from './wechat.schema';
export function weChatConfigToFormSettings(config: WechatConfig): WeChatSettingsFormValues {
  return createWeChatSettingsFormSchema().parse(structuredClone(config));
}
export function weChatFormSettingsToConfig(values: WeChatSettingsFormValues): WechatConfig {
  return omitEmptyValues(createWeChatSettingsFormSchema().parse(values));
}
export function createDefaultWeChatSettings(): WeChatSettingsFormValues {
  return { message_type: 'text', http_config: {} };
}
