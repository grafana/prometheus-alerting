import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setDataSourceSrv } from '@grafana/runtime';
import { beforeEach, describe, expect, it, rs } from '@rstest/core';

import { AlertingPermission } from '../../../access-control/abilities';
import { mockAlertmanagerDs, mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import { setMimirAlertmanagerRawConfig } from '../../../test/handlers/mimir-alertmanager';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { AlertmanagerConfiguration } from './AlertmanagerConfiguration';
import * as grafanaUiActual from '@grafana/ui' with { rstest: 'importActual' };

rs.mock('@grafana/ui', () => {
  const actual = grafanaUiActual;

  return {
    ...actual,
    CodeEditor: ({ value, readOnly }: { value: string; readOnly?: boolean }) => (
      <textarea aria-label="YAML editor" readOnly={readOnly} value={value} />
    ),
  };
});

const storedDocument = `template_files: {}
alertmanager_config: |
    route:
      receiver: stored-receiver
`;

function renderConfiguration(dataSourceUID: string) {
  const Wrapper = createTestWrapper(dataSourceUID);

  return render(
    <Wrapper>
      <AlertmanagerConfiguration />
    </Wrapper>
  );
}

describe('AlertmanagerConfiguration', () => {
  beforeEach(() => {
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);
    setMimirAlertmanagerRawConfig(storedDocument);
  });

  it('opens on the stored configuration, editable on Mimir once the warning is acknowledged', async () => {
    renderConfiguration(mockMimirAlertmanagerDs.uid);

    const editor = await screen.findByRole('textbox', { name: 'YAML editor' });
    expect(editor).toHaveValue('route:\n  receiver: stored-receiver\n');
    expect(editor).toHaveAttribute('readonly');
    expect(await screen.findByRole('button', { name: 'Save configuration' })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'I understand the consequences, I want to edit the configuration' })
    );

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).not.toHaveAttribute('readonly');
  });

  it('shows the running configuration read-only, and says where it came from', async () => {
    renderConfiguration(mockMimirAlertmanagerDs.uid);

    await userEvent.click(screen.getByRole('tab', { name: 'Resolved' }));

    expect(await screen.findByText('This is what the Alertmanager loaded')).toBeInTheDocument();
    expect(screen.getByText(/secrets are redacted/)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'Save configuration' })).not.toBeInTheDocument();
  });

  it('explains why a vanilla Alertmanager has no source to edit', async () => {
    renderConfiguration(mockAlertmanagerDs.uid);

    expect(await screen.findByText('Configuration changes unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save configuration' })).not.toBeInTheDocument();
    // Nothing can be saved here, so the warning about saving would only be noise.
    expect(screen.queryByText('Saving replaces the whole configuration')).not.toBeInTheDocument();
  });

  it('still shows a vanilla Alertmanager its running configuration', async () => {
    renderConfiguration(mockAlertmanagerDs.uid);

    await userEvent.click(screen.getByRole('tab', { name: 'Resolved' }));

    expect(await screen.findByText('This is what the Alertmanager loaded')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('readonly');
  });
});
