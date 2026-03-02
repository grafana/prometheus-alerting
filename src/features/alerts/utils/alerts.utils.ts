import {
  AlertGroup,
  AlertStatus,
  GettableAlert,
  parsePromQLStyleMatcherLooseSafe,
  type Matcher as AmMatcher,
} from '@grafana/external-alertmanager/vanilla';
import { labelsMatchMatchers, looseParseMatcher, Matcher } from '../../../utils/labels';
import { groupBy, mapValues, values } from 'lodash';

export type AlertGroupCounts = Record<AlertStatus['state'], number> & {
  silenced: number;
  inhibited: number;
  muted: number;
};

export function countAlertsByState(alerts: GettableAlert[]): AlertGroupCounts {
  const counts: AlertGroupCounts = { active: 0, unprocessed: 0, suppressed: 0, silenced: 0, inhibited: 0, muted: 0 };

  for (const alert of alerts) {
    const state = alert.status.state;

    if (state === 'active') {
      counts.active++;
    } else if (state === 'unprocessed') {
      counts.unprocessed++;
    } else {
      counts.suppressed++;
      if (alert.status.silencedBy.length > 0) {
        counts.silenced++;
      }
      if (alert.status.inhibitedBy.length > 0) {
        counts.inhibited++;
      }
      if (alert.status.mutedBy.length > 0) {
        counts.muted++;
      }
    }
  }

  return counts;
}

export function alertMatchesFilters(
  alert: GettableAlert,
  allowedStates: Set<AlertStatus['state']>,
  matchers: Matcher[]
): boolean {
  if (!allowedStates.has(alert.status.state)) {
    return false;
  }
  if (matchers.length > 0) {
    return labelsMatchMatchers(alert.labels, matchers);
  }
  return true;
}

export function parseMatchers(input: string): Matcher[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  // Try PromQL-style first (handles both `{foo="bar"}` and `foo="bar",env=~"prod.*"`)
  const amMatchers = parsePromQLStyleMatcherLooseSafe(trimmed);
  if (amMatchers.length > 0) {
    return amMatchers.map(toMatcher);
  }

  // Fall back to single loose matcher (e.g. `foo=bar`)
  const single = looseParseMatcher(trimmed);
  return single ? [single] : [];
}

function toMatcher(m: AmMatcher): Matcher {
  return {
    name: m.name,
    value: m.value,
    operator: m.isRegex ? (m.isEqual ? '=~' : '!~') : m.isEqual ? '=' : '!=',
  };
}

export type GroupedAlerts = { group: AlertGroup; receivers: string[] };

export function deduplicateGroups(groups: AlertGroup[]): GroupedAlerts[] {
  const grouped = groupBy(groups, (group) => {
    const labelKey = Object.entries(group.labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    const alertKey = group.alerts
      .map((a) => a.fingerprint)
      .sort()
      .join(',');
    return `${labelKey}|${alertKey}`;
  });

  const deduplicatedGroups = mapValues(grouped, (groupsArray) => {
    const firstGroup = groupsArray[0];
    const receivers = groupsArray.map((g) => g.receiver.name);
    return { group: firstGroup, receivers };
  });

  return values(deduplicatedGroups);
}
