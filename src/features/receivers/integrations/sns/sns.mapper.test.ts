import type { SNSConfig } from '@grafana/external-alertmanager/vanilla';

import { createDefaultSNSSettings, snsConfigToFormSettings, snsFormSettingsToConfig } from './sns.mapper';
import { SNSSettingsFormSchema } from './sns.schema';

describe('SNS mapper', () => {
  it('round-trips API-shaped fields and unknown values', () => {
    const config = {
      api_url: 'https://sns.us-east-1.amazonaws.com',
      topic_arn: 'arn:aws:sns:us-east-1:123456789012:alerts',
      sigv4: { region: 'us-east-1', access_key: 'access', secret_key: 'secret' },
      attributes: { severity: 'critical' },
      future_sns_option: 'keep',
      http_config: { follow_redirects: false, future_http_option: 'keep-too' },
    } satisfies SNSConfig;

    expect(snsFormSettingsToConfig(snsConfigToFormSettings(config))).toEqual(config);
  });

  it('requires a destination', () => {
    const result = SNSSettingsFormSchema.safeParse(createDefaultSNSSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['topic_arn'] })]));
    }
  });

  it('requires paired SigV4 access and secret keys', () => {
    const settings = createDefaultSNSSettings();
    settings.topic_arn = 'arn:aws:sns:us-east-1:123456789012:alerts';
    settings.sigv4 = { access_key: 'access' };

    const result = SNSSettingsFormSchema.safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['sigv4', 'access_key'] })])
      );
    }
  });

  it('rejects conflicting HTTP authentication methods', () => {
    const settings = createDefaultSNSSettings();
    settings.topic_arn = 'arn:aws:sns:us-east-1:123456789012:alerts';
    settings.http_config = {
      authorization: { credentials: 'token' },
      basic_auth: { username: 'user' },
    };

    const result = SNSSettingsFormSchema.safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['http_config', 'authorization', 'credentials'] })])
      );
    }
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('SNS settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      topic_arn: 'arn:aws:sns:us-east-1:1:alerts',
      use_aws_http_client: true,
    };

    expect(snsFormSettingsToConfig(snsConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
