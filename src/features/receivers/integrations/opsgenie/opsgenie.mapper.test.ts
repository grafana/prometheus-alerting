import type { OpsGenieConfig } from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultOpsgenieSettings,
  opsgenieConfigToFormSettings,
  opsgenieFormSettingsToConfig,
} from './opsgenie.mapper';
import { createOpsgenieSettingsFormSchema } from './opsgenie.schema';
describe('Opsgenie mapper', () => {
  it('round-trips collections, HTTP config, and unknown fields', () => {
    const config = {
      api_key: 'secret',
      message: 'Alert',
      details: { env: 'prod' },
      responders: [{ type: 'team', id: 'team-id' }],
      http_config: { follow_redirects: false },
      future_option: 'keep',
    } satisfies OpsGenieConfig;
    expect(opsgenieFormSettingsToConfig(opsgenieConfigToFormSettings(config))).toEqual(config);
  });
  it('requires an API key or API key file', () => {
    const result = createOpsgenieSettingsFormSchema().safeParse(createDefaultOpsgenieSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['api_key'] })]));
    }
  });
  it('rejects unsupported priorities', () => {
    const settings = createDefaultOpsgenieSettings();
    settings.api_key = 'secret';
    settings.priority = 'URGENT';
    expect(createOpsgenieSettingsFormSchema().safeParse(settings).success).toBe(false);
  });
  it('rejects messages over 130 characters', () => {
    const settings = createDefaultOpsgenieSettings();
    settings.message = 'x'.repeat(131);
    expect(createOpsgenieSettingsFormSchema().safeParse(settings).success).toBe(false);
  });
  it('rejects API key and API key file together', () => {
    const settings = createDefaultOpsgenieSettings();
    settings.api_key = 'secret';
    settings.api_key_file = '/secret';
    const result = createOpsgenieSettingsFormSchema().safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['api_key'] })]));
    }
  });
});

/**
 * Alertmanager understands more of this integration than the form shows. We deliberately do not
 * validate a setting nobody can edit, so the least we owe is that opening a receiver and saving it
 * again gives them back untouched.
 */
describe('Opsgenie settings the form does not show', () => {
  it('hands them back unchanged after a round trip', () => {
    const config = {
      api_key_file: '/etc/alerting/opsgenie',
      entity: 'payments',
      actions: 'restart,page',
      update_alerts: true,
    };

    expect(opsgenieFormSettingsToConfig(opsgenieConfigToFormSettings(config as never))).toMatchObject(config);
  });
});
