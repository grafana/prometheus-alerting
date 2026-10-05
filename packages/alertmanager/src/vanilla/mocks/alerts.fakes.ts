import { Factory } from 'fishery';

import type { AlertGroup, GettableAlert } from '../api/types/common';

export const GettableAlertFactory = Factory.define<GettableAlert>(({ sequence }) => ({
  fingerprint: `fingerprint-${sequence}`,
  labels: {},
  annotations: {},
  receivers: [{ name: 'default' }],
  startsAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  endsAt: new Date(0).toISOString(),
  status: { state: 'active', silencedBy: [], inhibitedBy: [], mutedBy: [] },
}));

export const AlertGroupFactory = Factory.define<AlertGroup>(() => ({
  labels: {},
  receiver: { name: 'default' },
  alerts: [],
}));
