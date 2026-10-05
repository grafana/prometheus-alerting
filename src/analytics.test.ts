import { createMonitoringLogger, reportInteraction } from '@grafana/runtime';
import { trackInteraction } from './analytics';

// Spy on the real module instead of replacing it – reportInteraction falls back to Grafana's
// buffering FakeEchoSrv when no backend is registered, so the genuine implementation is safe here.
rs.mock('@grafana/runtime', { spy: true });

// Asserting the shape rather than the value: comparing against package.json would just be comparing
// the version to its own source. This fails if we ever ship plugin.json's unsubstituted %VERSION%.
const semver = expect.stringMatching(/^\d+\.\d+\.\d+/);

describe('analytics', () => {
  it('reports logs against the plugin source, stamped with the released version', () => {
    // The logger is built while ./analytics is first imported, so this call has already happened.
    expect(rs.mocked(createMonitoringLogger)).toHaveBeenCalledWith('plugins.prometheusalerting', {
      module: 'PrometheusAlerting',
      plugin_version: semver,
    });
  });

  it('prefixes interaction events and stamps them with the released version', () => {
    trackInteraction('rule_saved', { form_action: 'create' });

    expect(rs.mocked(reportInteraction)).toHaveBeenCalledWith('grafana_prometheusalerting_rule_saved', {
      form_action: 'create',
      plugin_version: semver,
    });
  });
});
