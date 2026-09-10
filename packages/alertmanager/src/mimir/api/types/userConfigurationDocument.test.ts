import { parse as parseYaml } from 'yaml';

import { readAlertmanagerConfigYaml, writeAlertmanagerConfigYaml } from './userConfigurationDocument';

const TEMPLATE = '{{ define "alert.title" }}[{{ .Status }}] {{ .CommonLabels.alertname }}{{ end }}\n';

// Indented with four spaces, which is what Go's YAML writer produces, so the tests exercise a
// document shaped the way Mimir actually hands it back.
const document = `template_files:
    default.tmpl: |
        ${TEMPLATE.trimEnd()}
alertmanager_config: |
    # Alerts for the platform team.
    route:
      receiver: default
      matchers:
        - severity = critical
    receivers:
      - name: default
        webhook_configs:
          - url: 'http://localhost:9999/webhook'
`;

const alertmanagerConfig = `# Alerts for the platform team.
route:
  receiver: default
  matchers:
    - severity = critical
receivers:
  - name: default
    webhook_configs:
      - url: 'http://localhost:9999/webhook'
`;

describe('readAlertmanagerConfigYaml', () => {
  it('returns the stored configuration untouched', () => {
    expect(readAlertmanagerConfigYaml(document)).toBe(alertmanagerConfig);
  });

  it('returns a starting configuration when the tenant has none', () => {
    expect(readAlertmanagerConfigYaml('template_files: {}\nalertmanager_config: ""\n')).toContain(
      'receiver: empty-receiver'
    );
  });

  it('returns a starting configuration for an empty document', () => {
    expect(readAlertmanagerConfigYaml('')).toContain('receiver: empty-receiver');
  });
});

describe('writeAlertmanagerConfigYaml', () => {
  it('keeps the comments and quoting of whatever it is given', () => {
    const updated = writeAlertmanagerConfigYaml(document, alertmanagerConfig);

    expect(readAlertmanagerConfigYaml(updated)).toBe(alertmanagerConfig);
  });

  it('leaves the template files alone', () => {
    const updated = writeAlertmanagerConfigYaml(document, 'route:\n  receiver: other\n');

    expect(parseYaml(updated).template_files).toEqual({ 'default.tmpl': TEMPLATE });
  });

  it('leaves keys it does not know about alone', () => {
    const withExtra = `extra_key: keep-me\n${document}`;

    const updated = writeAlertmanagerConfigYaml(withExtra, 'route:\n  receiver: other\n');

    expect(parseYaml(updated).extra_key).toBe('keep-me');
  });

  it('writes the configuration as a readable block rather than an escaped string', () => {
    const updated = writeAlertmanagerConfigYaml(document, 'route:\n  receiver: other\n');

    expect(updated).toContain('alertmanager_config: |');
    expect(updated).not.toContain('\\n');
  });

  it('builds a document when the tenant has none', () => {
    const updated = writeAlertmanagerConfigYaml('', 'route:\n  receiver: other\n');

    expect(parseYaml(updated)).toEqual({
      template_files: {},
      alertmanager_config: 'route:\n  receiver: other\n',
    });
  });
});
