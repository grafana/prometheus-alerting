import { AlertGroupFactory, AlertStatusFactory, GettableAlertFactory } from '../mocks/alerts.fakes';
import {
  alertMatchesFilters,
  countAlertsByState,
  countAlertsInGroupsByState,
  deduplicateGroups,
  parseMatchers,
} from './alerts.utils';

describe('countAlertsByState', () => {
  it('returns all zeros for an empty list', () => {
    expect(countAlertsByState([])).toEqual({
      active: 0,
      unprocessed: 0,
      suppressed: 0,
      silenced: 0,
      inhibited: 0,
      muted: 0,
    });
  });

  it('counts active alerts', () => {
    const alerts = GettableAlertFactory.buildList(2, { status: AlertStatusFactory.build({ state: 'active' }) });
    expect(countAlertsByState(alerts).active).toBe(2);
  });

  it('counts unprocessed alerts', () => {
    const alerts = GettableAlertFactory.buildList(1, { status: AlertStatusFactory.build({ state: 'unprocessed' }) });
    expect(countAlertsByState(alerts).unprocessed).toBe(1);
  });

  it('counts suppressed alerts', () => {
    const alerts = GettableAlertFactory.buildList(2, {
      status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['silence-1'] }),
    });
    expect(countAlertsByState(alerts).suppressed).toBe(2);
  });

  it('counts suppressed sub-reasons independently', () => {
    const alerts = [
      GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['s1'] }) }),
      GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'suppressed', inhibitedBy: ['i1'] }) }),
      GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'suppressed', mutedBy: ['m1'] }) }),
    ];
    const counts = countAlertsByState(alerts);
    expect(counts.silenced).toBe(1);
    expect(counts.inhibited).toBe(1);
    expect(counts.muted).toBe(1);
  });

  it('counts a suppressed alert in multiple sub-reason buckets simultaneously', () => {
    const alert = GettableAlertFactory.build({
      status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['s1'], inhibitedBy: ['i1'] }),
    });
    const counts = countAlertsByState([alert]);
    expect(counts.suppressed).toBe(1);
    expect(counts.silenced).toBe(1);
    expect(counts.inhibited).toBe(1);
  });
});

describe('countAlertsInGroupsByState', () => {
  it('counts alerts from duplicate receiver groups once', () => {
    const duplicateAlert = GettableAlertFactory.build({ fingerprint: 'duplicate-alert' });
    const distinctAlert = GettableAlertFactory.build({ fingerprint: 'distinct-alert' });
    const pagerdutyGroup = AlertGroupFactory.build({
      labels: { alertname: 'HighErrorRate' },
      receiver: { name: 'pagerduty' },
      alerts: [duplicateAlert],
    });
    const slackGroup = { ...pagerdutyGroup, receiver: { name: 'slack-critical' } };
    const distinctGroup = AlertGroupFactory.build({ alerts: [distinctAlert] });

    expect(countAlertsInGroupsByState([pagerdutyGroup, slackGroup, distinctGroup])).toMatchObject({ active: 2 });
  });
});

describe('deduplicateGroups', () => {
  it('returns an empty array for no groups', () => {
    expect(deduplicateGroups([])).toEqual([]);
  });

  it('returns each distinct group once with its receiver name', () => {
    const group1 = AlertGroupFactory.build({ labels: { env: 'prod' } });
    const group2 = AlertGroupFactory.build({ labels: { env: 'staging' } });

    const result = deduplicateGroups([group1, group2]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ group: group1, receivers: [group1.receiver.name] });
    expect(result[1]).toEqual({ group: group2, receivers: [group2.receiver.name] });
  });

  it('merges groups with the same labels and alerts, collecting all receiver names', () => {
    // Build a base group once, then derive the other groups from it — same labels,
    // same alerts, different receiver. Deliberately reverse label/alert order to verify
    // that sorting makes the key order-independent.
    // Note: spread base to override labels fully (factory merges rather than replaces).
    const base = AlertGroupFactory.build();
    const labels = { b: '2', a: '1' };
    const group1 = { ...base, labels, receiver: { name: 'slack' } };
    const group2 = {
      ...base,
      labels: { a: '1', b: '2' },
      receiver: { name: 'pagerduty' },
      alerts: [...base.alerts].reverse(),
    };
    const group3 = { ...base, labels, receiver: { name: 'email' } };

    const result = deduplicateGroups([group1, group2, group3]);

    expect(result).toHaveLength(1);
    expect(result[0].group).toBe(group1);
    expect(result[0].receivers).toEqual(['slack', 'pagerduty', 'email']);
  });
});

describe('parseMatchers', () => {
  it('returns no matchers and no error for empty input', () => {
    expect(parseMatchers('')).toEqual({ matchers: [] });
    expect(parseMatchers('   ')).toEqual({ matchers: [] });
  });

  it('parses a single loose matcher', () => {
    expect(parseMatchers('team=frontend')).toEqual({
      matchers: [{ name: 'team', operator: '=', value: 'frontend' }],
    });
  });

  it('parses PromQL-style matchers, braced or bare', () => {
    expect(parseMatchers('{severity="critical", team=~"platform.*"}')).toEqual({
      matchers: [
        { name: 'severity', operator: '=', value: 'critical' },
        { name: 'team', operator: '=~', value: 'platform.*' },
      ],
    });
  });

  it('returns an error for unparseable input instead of silently dropping it', () => {
    const result = parseMatchers('=critical');
    expect(result.matchers).toEqual([]);
    expect(result.error).toEqual(new Error('Invalid matcher syntax'));
  });

  it.each(['team=frontend,severity', 'team!~frontend, environment'])(
    'rejects malformed multi-matcher input instead of parsing it as one loose matcher: %s',
    (input) => {
      const result = parseMatchers(input);
      expect(result.matchers).toEqual([]);
      expect(result.error).toEqual(new Error('Invalid matcher syntax'));
    }
  );

  it.each(['team=~[', 'team!~['])('rejects an invalid regular expression: %s', (input) => {
    const result = parseMatchers(input);
    expect(result.matchers).toEqual([]);
    expect(result.error).toEqual(new Error('Invalid matcher syntax'));
  });
});

describe('alertMatchesFilters', () => {
  const allowedStates = new Set<'active' | 'unprocessed' | 'suppressed'>(['active']);

  it('matches when there is no label filter', () => {
    const alert = GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'active' }) });
    expect(alertMatchesFilters(alert, allowedStates, { matchers: [] })).toBe(true);
  });

  it('excludes alerts not in an allowed state', () => {
    const alert = GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'unprocessed' }) });
    expect(alertMatchesFilters(alert, allowedStates, { matchers: [] })).toBe(false);
  });

  it('matches only alerts satisfying the label matchers', () => {
    const matching = GettableAlertFactory.build({
      labels: { team: 'frontend' },
      status: AlertStatusFactory.build({ state: 'active' }),
    });
    const nonMatching = GettableAlertFactory.build({
      labels: { team: 'backend' },
      status: AlertStatusFactory.build({ state: 'active' }),
    });
    const labelFilter = { matchers: [{ name: 'team', operator: '=' as const, value: 'frontend' }] };

    expect(alertMatchesFilters(matching, allowedStates, labelFilter)).toBe(true);
    expect(alertMatchesFilters(nonMatching, allowedStates, labelFilter)).toBe(false);
  });

  it('excludes every alert when the label filter is invalid, rather than showing everything', () => {
    const alert = GettableAlertFactory.build({ status: AlertStatusFactory.build({ state: 'active' }) });
    expect(
      alertMatchesFilters(alert, allowedStates, { matchers: [], error: new Error('Invalid matcher syntax') })
    ).toBe(false);
  });

  it('defensively excludes alerts for an invalid negative regular expression', () => {
    const alert = GettableAlertFactory.build({
      labels: { team: 'frontend' },
      status: AlertStatusFactory.build({ state: 'active' }),
    });
    const labelFilter = { matchers: [{ name: 'team', operator: '!~' as const, value: '[' }] };

    expect(alertMatchesFilters(alert, allowedStates, labelFilter)).toBe(false);
  });
});
