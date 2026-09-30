import type { WechatConfig } from '@grafana/external-alertmanager/vanilla';
import { omitEmptyValues } from '../../utils/omitEmptyValues';
import { WeChatSettingsSchema, WeChatSettingsFormValues } from './wechat.schema';
export function weChatConfigToFormSettings(config: WechatConfig): WeChatSettingsFormValues {
  return WeChatSettingsSchema.parse(structuredClone(config));
}
export function weChatFormSettingsToConfig(values: WeChatSettingsFormValues): WechatConfig {
  return omitEmptyValues(WeChatSettingsSchema.parse(values));
}
export function createDefaultWeChatSettings(): WeChatSettingsFormValues {
  return { message_type: 'text', http_config: {} };
}
