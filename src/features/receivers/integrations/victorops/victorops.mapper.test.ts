import type { VictorOpsConfig } from '@grafana/external-alertmanager/vanilla';
import {
  createDefaultVictorOpsSettings,
  victorOpsConfigToFormSettings,
  victorOpsFormSettingsToConfig,
} from './victorops.mapper';
import { createVictorOpsSettingsFormSchema } from './victorops.schema';
describe('VictorOps mapper', () => {
  it('round-trips hidden, HTTP, and unknown fields', () => {
    const config = {
      api_key: 'secret',
      routing_key: 'team',
      custom_fields: { env: 'prod' },
      http_config: { enable_http2: false },
      future_option: 'keep',
    } satisfies VictorOpsConfig;
    expect(victorOpsFormSettingsToConfig(victorOpsConfigToFormSettings(config))).toEqual(config);
  });
  it('requires an API key and rejects unsupported message types', () => {
    const settings = createDefaultVictorOpsSettings();
    settings.routing_key = 'team';
    settings.message_type = 'URGENT';
    const result = createVictorOpsSettingsFormSchema().safeParse(settings);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toEqual(
        expect.arrayContaining([['api_key'], ['message_type']])
      );
    }
  });
  it('requires a routing key', () => {
    const result = createVictorOpsSettingsFormSchema().safeParse(createDefaultVictorOpsSettings());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(expect.arrayContaining([expect.objectContaining({ path: ['routing_key'] })]));
    }
  });
});
