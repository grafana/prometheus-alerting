import { Factory } from 'fishery';

import type { AlertGroup, AlertStatus, GettableAlert } from '@grafana/external-alertmanager/vanilla';

export const AlertStatusFactory = Factory.define<AlertStatus>(() => ({
  state: 'active',
  silencedBy: [],
  inhibitedBy: [],
  mutedBy: [],
}));

export const GettableAlertFactory = Factory.define<GettableAlert>(({ sequence }) => ({
  fingerprint: `fingerprint-${sequence}`,
  labels: { alertname: `Alert ${sequence}` },
  annotations: {},
  receivers: [{ name: 'default' }],
  startsAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  endsAt: new Date().toISOString(),
  status: AlertStatusFactory.build(),
}));

export const AlertGroupFactory = Factory.define<AlertGroup>(({ sequence }) => ({
  labels: { namespace: `namespace-${sequence}` },
  receiver: { name: 'default' },
  alerts: GettableAlertFactory.buildList(3),
}));
