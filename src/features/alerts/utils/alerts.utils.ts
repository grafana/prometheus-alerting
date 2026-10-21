import { AlertGroup, AlertStatus, GettableAlert } from '@grafana/external-alertmanager/vanilla';
import { labelsMatchMatchers, MatcherParseResult } from '../../../utils/labels';
export { parseMatchers } from '../../../utils/labels';
import { groupBy, mapValues, values } from 'lodash';
import type { FilterValues } from '../hooks/alertsFiltersReducer';

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

export function countAlertsInGroupsByState(groups: AlertGroup[]): AlertGroupCounts {
  const alerts = deduplicateGroups(groups).flatMap(({ group }) => group.alerts);
  return countAlertsByState(alerts);
}

export function alertMatchesFilters(
  alert: GettableAlert,
  showState: Record<AlertStatus['state'], boolean>,
  matcherParseResult: MatcherParseResult
): boolean {
  if (!showState[alert.status.state]) {
    return false;
  }
  // An unparseable filter must narrow the result set to nothing, never widen it to everything.
  if (matcherParseResult.error) {
    return false;
  }
  if (matcherParseResult.matchers.length > 0) {
    return labelsMatchMatchers(alert.labels, matcherParseResult.matchers);
  }
  return true;
}

export function filterAlertGroups(
  groups: AlertGroup[],
  filters: FilterValues,
  labelFilter: MatcherParseResult
): AlertGroup[] {
  const { receivers, showActive, showUnprocessed, showSuppressed } = filters;
  const showState = { active: showActive, unprocessed: showUnprocessed, suppressed: showSuppressed };

  return groups
    .filter((group) => receivers.length === 0 || receivers.includes(group.receiver.name))
    .map((group) => ({
      ...group,
      alerts: group.alerts.filter((alert) => alertMatchesFilters(alert, showState, labelFilter)),
    }))
    .filter((group) => group.alerts.length > 0);
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
