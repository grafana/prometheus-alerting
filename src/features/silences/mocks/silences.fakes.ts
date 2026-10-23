import { Factory } from 'fishery';

import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';

export const GettableSilenceFactory = Factory.define<GettableSilence>(({ sequence }) => ({
  id: `silence-${sequence}`,
  matchers: [],
  startsAt: '2026-01-01T00:00:00Z',
  endsAt: '2026-01-02T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  createdBy: 'admin',
  comment: '',
  status: { state: 'active' },
}));
