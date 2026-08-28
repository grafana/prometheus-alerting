import type { WechatConfig } from '@grafana/external-alertmanager/vanilla';
import { createDefaultWeChatSettings, weChatConfigToFormSettings, weChatFormSettingsToConfig } from './wechat.mapper';
import { WeChatSettingsFormSchema } from './wechat.schema';
describe('WeChat mapper', () => {
  it('round-trips secrets, HTTP, false, and unknown fields', () => {
    const config = {
      api_secret: 'secret',
      message_type: 'markdown',
      http_config: { follow_redirects: false },
      future_option: 'keep',
    } satisfies WechatConfig;
    expect(weChatFormSettingsToConfig(weChatConfigToFormSettings(config))).toEqual(config);
  });
  it('defaults message type to text', () => {
    expect(createDefaultWeChatSettings()).toMatchObject({ message_type: 'text' });
  });
  it('rejects proxy conflicts', () => {
    const result = WeChatSettingsFormSchema.safeParse({
      http_config: { proxy_url: 'http://proxy', proxy_from_environment: true },
    });
    expect(result.success).toBe(false);
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('WeChat settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      corp_id: 'corp',
      api_secret_file: '/etc/alerting/wechat',
    };

    expect(weChatFormSettingsToConfig(weChatConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
