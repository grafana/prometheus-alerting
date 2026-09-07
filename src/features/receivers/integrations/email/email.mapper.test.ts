import type { EmailConfig } from '@grafana/external-alertmanager/vanilla';

import { createDefaultEmailSettings, emailConfigToFormSettings, emailFormSettingsToConfig } from './email.mapper';
import { createEmailSettingsFormSchema } from './email.schema';

describe('Email mapper', () => {
  it('round-trips API-shaped, unknown, and unrendered fields', () => {
    const config = {
      to: 'alerts@example.com',
      from: 'alertmanager@example.com',
      auth_password: 'secret',
      headers: { 'X-Environment': 'production' },
      tls_config: { server_name: 'smtp.example.com', ca_file: '/etc/ca.pem' },
      http_config: { follow_redirects: false },
      future_email_option: 'keep',
    } satisfies EmailConfig;

    expect(emailFormSettingsToConfig(emailConfigToFormSettings(config))).toEqual(config);
  });

  it('round-trips a configuration that relies on Alertmanager recipient defaults', () => {
    const config = { auth_password_file: '/run/secrets/smtp-password' } satisfies EmailConfig;
    expect(emailFormSettingsToConfig(emailConfigToFormSettings(config))).toEqual(config);
  });

  it('requires a recipient', () => {
    const result = createEmailSettingsFormSchema().safeParse(createDefaultEmailSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['to'] })]));
    }
  });

  it('rejects password and password file together', () => {
    const settings = createDefaultEmailSettings();
    settings.to = 'alerts@example.com';
    settings.auth_password = 'secret';
    settings.auth_password_file = '/var/run/secrets/smtp';

    const result = createEmailSettingsFormSchema().safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['auth_password'] })])
      );
    }
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('Email settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      to: 'alerts@example.com',
      auth_password_file: '/etc/alerting/password',
      auth_secret_file: '/etc/alerting/secret',
      force_implicit_tls: true,
      threading: { enabled: true, thread_by_date: 'daily' },
    };

    expect(emailFormSettingsToConfig(emailConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
