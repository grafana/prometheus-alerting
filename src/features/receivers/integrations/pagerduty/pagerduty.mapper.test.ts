import type { PagerdutyConfig } from '@grafana/external-alertmanager/vanilla';

import {
  createDefaultPagerDutySettings,
  pagerDutyConfigToFormSettings,
  pagerDutyFormSettingsToConfig,
} from './pagerduty.mapper';
import { createPagerDutySettingsFormSchema } from './pagerduty.schema';

describe('PagerDuty mapper', () => {
  it('keeps form values aligned with PagerdutyConfig', () => {
    const config = {
      routing_key: 'routing-secret',
      client: 'client',
      details: { environment: 'production' },
      images: [{ src: 'https://example.com/image.png', alt: 'Graph' }],
      links: [{ href: 'https://example.com', text: 'Open' }],
      http_config: {
        authorization: { type: 'Bearer', credentials: 'http-secret' },
        follow_redirects: false,
      },
    } satisfies PagerdutyConfig;

    expect(pagerDutyConfigToFormSettings(config)).toEqual(config);
  });

  it('preserves unknown and unrendered fields losslessly', () => {
    const config = {
      routing_key: 'routing-secret',
      future_pagerduty_option: 'keep',
      http_config: {
        future_http_option: 'keep-too',
        tls_config: { ca_file: '/etc/ca.pem' },
      },
    } satisfies PagerdutyConfig;

    expect(pagerDutyFormSettingsToConfig(pagerDutyConfigToFormSettings(config))).toEqual(config);
  });

  it('rejects conflicting HTTP authentication methods at the authorization field', () => {
    const settings = createDefaultPagerDutySettings();
    settings.http_config = {
      authorization: { credentials: 'token' },
      basic_auth: { username: 'user' },
    };

    const result = createPagerDutySettingsFormSchema().safeParse(settings);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: ['http_config', 'authorization', 'credentials'] })])
      );
    }
  });

  it('omits empty form values while preserving false', () => {
    const settings = createDefaultPagerDutySettings();
    settings.routing_key = 'routing-secret';
    settings.client = '';
    settings.http_config = { follow_redirects: false, proxy_url: '' };

    expect(pagerDutyFormSettingsToConfig(settings)).toEqual({
      routing_key: 'routing-secret',
      http_config: { follow_redirects: false },
    });
  });
});
