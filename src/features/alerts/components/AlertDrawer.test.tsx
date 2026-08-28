import React from 'react';
import { render, screen } from '@testing-library/react';

import { AlertingPermission } from '../../../access-control/abilities';
import { setCurrentUserPermissions } from '../../../test/mocks/grafana-runtime';
import { TestMemoryRouter } from '../../../test/utils/test-wrapper';
import { AlertStatusFactory, GettableAlertFactory } from '../mocks/alerts.fakes';
import { AlertDrawer } from './AlertDrawer';

function renderDrawer(alert = GettableAlertFactory.build()) {
  return render(<AlertDrawer alert={alert} onClose={() => {}} />, { wrapper: TestMemoryRouter });
}

describe('AlertDrawer silence actions', () => {
  it('offers a silence prefilled with the instance labels', () => {
    setCurrentUserPermissions(AlertingPermission.InstancesRead, AlertingPermission.InstancesWrite);

    renderDrawer(
      GettableAlertFactory.build({
        labels: { alertname: 'HighMemoryUsage', instance: 'server-1' },
      })
    );

    const link = screen.getByRole('link', { name: 'Silence' });
    const url = new URL(link.getAttribute('href') ?? '', 'http://localhost');

    expect(url.pathname).toContain('/silences/new');
    expect(JSON.parse(url.searchParams.get('matchers') ?? '[]')).toEqual([
      { name: 'alertname', value: 'HighMemoryUsage', isRegex: false, isEqual: true },
      { name: 'instance', value: 'server-1', isRegex: false, isEqual: true },
    ]);
  });

  it('hides the silence action from a user who cannot change silences', () => {
    setCurrentUserPermissions(AlertingPermission.InstancesRead);

    renderDrawer();

    expect(screen.queryByRole('link', { name: 'Silence' })).not.toBeInTheDocument();
  });

  it('links a silenced instance to the silences suppressing it instead of offering another one', () => {
    setCurrentUserPermissions(AlertingPermission.InstancesRead, AlertingPermission.InstancesWrite);

    renderDrawer(
      GettableAlertFactory.build({
        status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['silence-1', 'silence-2'] }),
      })
    );

    expect(screen.queryByRole('link', { name: 'Silence' })).not.toBeInTheDocument();

    const manage = screen.getByRole('link', { name: 'Manage silences' });
    const url = new URL(manage.getAttribute('href') ?? '', 'http://localhost');
    expect(url.searchParams.get('silenceIds')).toBe('silence-1,silence-2');

    // Each ID is also a link on the "Silenced by" row.
    expect(screen.getByRole('link', { name: 'silence-1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'silence-2' })).toBeInTheDocument();
  });

  it('still offers a silence for an instance suppressed only by inhibition', () => {
    setCurrentUserPermissions(AlertingPermission.InstancesRead, AlertingPermission.InstancesWrite);

    renderDrawer(
      GettableAlertFactory.build({
        status: AlertStatusFactory.build({ state: 'suppressed', inhibitedBy: ['other-alert'] }),
      })
    );

    expect(screen.getByRole('link', { name: 'Silence' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage silences' })).not.toBeInTheDocument();
  });

  it('shows the silence IDs as plain text without permission to view silences', () => {
    setCurrentUserPermissions();

    renderDrawer(
      GettableAlertFactory.build({
        status: AlertStatusFactory.build({ state: 'suppressed', silencedBy: ['silence-1'] }),
      })
    );

    expect(screen.queryByRole('link', { name: 'silence-1' })).not.toBeInTheDocument();
    expect(screen.getByText('silence-1')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage silences' })).not.toBeInTheDocument();
  });
});
