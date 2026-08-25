import { parse as parseYaml } from 'yaml';

import { YamlToParsedUserConfiguration } from './alertmanagerConfiguration';

/**
 * Builds the YAML payload Mimir's `/api/v1/alerts` endpoint answers with: a YAML document whose
 * `alertmanager_config` is itself a YAML string.
 */
function mimirResponse(alertmanagerConfig: string): string {
  const indented = alertmanagerConfig
    .trim()
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');

  return `template_files: {}\nalertmanager_config: |\n${indented}\n`;
}

const CONFIG_WITH_GLOBAL = `
global:
  resolve_timeout: 10m
  smtp_from: alerts@example.com
  smtp_smarthost: smtp.example.com:587
  smtp_require_tls: true
  slack_api_url: https://hooks.slack.com/services/T000/B000/XXX
  pagerduty_url: https://events.pagerduty.com/v2/enqueue
  opsgenie_api_key: super-secret
  http_config:
    follow_redirects: false
route:
  receiver: default
receivers:
  - name: default
`;

describe('YamlToParsedUserConfiguration', () => {
  it('keeps the global block when a configuration is read and written back', () => {
    const configuration = YamlToParsedUserConfiguration.decode(mimirResponse(CONFIG_WITH_GLOBAL));

    expect(configuration.alertmanager_config.global).toEqual({
      resolve_timeout: '10m',
      smtp_from: 'alerts@example.com',
      smtp_smarthost: 'smtp.example.com:587',
      smtp_require_tls: true,
      slack_api_url: 'https://hooks.slack.com/services/T000/B000/XXX',
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue',
      opsgenie_api_key: 'super-secret',
      http_config: { follow_redirects: false },
    });

    // ...and the block is still there in the payload we POST back
    const encoded = parseYaml(YamlToParsedUserConfiguration.encode(configuration));
    expect(parseYaml(encoded.alertmanager_config).global).toEqual(configuration.alertmanager_config.global);
  });

  it('keeps global settings it does not know about', () => {
    const configuration = YamlToParsedUserConfiguration.decode(
      mimirResponse(`
global:
  some_future_integration_api_url: https://example.com/api
route:
  receiver: default
receivers:
  - name: default
`)
    );

    expect(configuration.alertmanager_config.global).toEqual({
      some_future_integration_api_url: 'https://example.com/api',
    });
  });

  it('leaves a configuration without a global block alone', () => {
    const configuration = YamlToParsedUserConfiguration.decode(
      mimirResponse(`
route:
  receiver: default
receivers:
  - name: default
`)
    );

    expect(configuration.alertmanager_config.global).toBeUndefined();
    expect(parseYaml(YamlToParsedUserConfiguration.encode(configuration)).alertmanager_config).not.toContain('global');
  });
});
