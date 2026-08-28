import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setDataSourceSrv } from '@grafana/runtime';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';

import { AlertingPermission } from '../../../access-control/abilities';
import { server } from '../../../test/server';
import { mockAlertmanagerDs } from '../../../test/fixtures/datasources';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { createTestWrapper, TestMemoryRouter } from '../../../test/utils/test-wrapper';
import SilencesPage from './SilencesList';

vi.mock('../../../components/AlertmanagerPicker/AlertmanagerPicker', () => ({
  AlertmanagerPicker: () => <div data-testid="alertmanager-picker" />,
}));

function silence(id: string, overrides: Partial<GettableSilence> = {}): GettableSilence {
  return {
    id,
    matchers: [{ name: 'alertname', value: id, isRegex: false, isEqual: true }],
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'someone',
    comment: '',
    status: { state: 'active' },
    ...overrides,
  };
}

function renderSilences(path: string, silences: GettableSilence[]) {
  server.use(http.get('/api/datasources/proxy/uid/:uid/api/v2/silences', () => HttpResponse.json(silences)));

  const Wrapper = createTestWrapper(mockAlertmanagerDs.uid);
  return render(
    <Wrapper>
      <TestMemoryRouter initialEntries={[path]}>
        <SilencesPage />
      </TestMemoryRouter>
    </Wrapper>
  );
}

describe('SilencesPage silenceIds filter', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.InstancesRead, AlertingPermission.InstancesWrite);
  });

  it('shows only the silences named in the URL', async () => {
    renderSilences('/silences?silenceIds=silence-1', [silence('silence-1'), silence('silence-2')]);

    await waitFor(() => {
      expect(screen.getByText('alertname="silence-1"')).toBeInTheDocument();
    });
    expect(screen.queryByText('alertname="silence-2"')).not.toBeInTheDocument();
    expect(screen.getByText('Showing only the silences linked from an alert instance.')).toBeInTheDocument();
  });

  it('shows a linked silence that has already expired', async () => {
    renderSilences('/silences?silenceIds=expired-silence', [
      silence('expired-silence', { status: { state: 'expired' } }),
    ]);

    // Expired silences are hidden by default on the unfiltered list – arriving from an alert
    // instance is the one case where we want it shown anyway.
    await waitFor(() => {
      expect(screen.getByText('alertname="expired-silence"')).toBeInTheDocument();
    });
  });

  it('drops the filter and shows everything again', async () => {
    renderSilences('/silences?silenceIds=silence-1', [silence('silence-1'), silence('silence-2')]);

    await waitFor(() => {
      expect(screen.getByText('alertname="silence-1"')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Show all silences' }));

    expect(await screen.findByText('alertname="silence-2"')).toBeInTheDocument();
  });

  it('explains that a linked silence is gone rather than claiming there are none', async () => {
    renderSilences('/silences?silenceIds=deleted-silence', [silence('silence-1')]);

    expect(await screen.findByText('The linked silences no longer exist.')).toBeInTheDocument();
  });
});
