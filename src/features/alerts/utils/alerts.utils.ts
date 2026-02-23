import type { AlertStatus, GettableAlert } from '@grafana/external-alertmanager/vanilla';

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
      if (alert.status.silencedBy.length > 0) { counts.silenced++; }
      if (alert.status.inhibitedBy.length > 0) { counts.inhibited++; }
      if (alert.status.mutedBy.length > 0) { counts.muted++; }
    }
  }

  return counts;
}
