import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setDataSourceSrv } from '@grafana/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { AlertingPermission } from '../../../access-control/abilities';
import { mockMimirAlertmanagerDs } from '../../../test/fixtures/datasources';
import {
  getMimirAlertmanagerRawConfig,
  setMimirAlertmanagerRawConfig,
} from '../../../test/handlers/mimir-alertmanager';
import {
  createMockDataSourceSrv,
  setCurrentUserPermissions,
  setMockGrafanaDataSources,
} from '../../../test/mocks/grafana-runtime';
import { server } from '../../../test/server';
import { createTestWrapper } from '../../../test/utils/test-wrapper';
import { StoredConfigEditor } from './StoredConfigEditor';

const mocks = vi.hoisted(() => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('../../../hooks/useAppNotifications', () => ({
  useAppNotifications: () => ({ success: mocks.notifySuccess, error: mocks.notifyError }),
}));

// The real editor is Monaco, which does not run in the test environment. A textarea keeps the parts
// this component depends on: text going in, an onChange handing every edit back, and readOnly.
//
// The onChange is captured on first render and never refreshed, which is what @grafana/ui does
// (handleOnMount destructures it once). Without that, a handler that goes stale looks fine here and
// only breaks in the real editor.
vi.mock('@grafana/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@grafana/ui')>();

  return {
    ...actual,
    CodeEditor: ({
      value,
      onChange,
      readOnly,
    }: {
      value: string;
      onChange: (value: string) => void;
      readOnly?: boolean;
    }) => {
      const mountedOnChange = React.useRef(onChange);

      return (
        <textarea
          aria-label="YAML editor"
          value={value}
          readOnly={readOnly}
          onChange={(event) => mountedOnChange.current(event.target.value)}
        />
      );
    },
  };
});

/** What Mimir has stored: the configuration below plus a template file that must survive a save. */
const storedDocument = `template_files:
    default.tmpl: |
        {{ define "alert.title" }}[{{ .Status }}]{{ end }}
alertmanager_config: |
    route:
      receiver: default
    receivers:
      - name: default
`;

const configuration = 'route:\n  receiver: default\nreceivers:\n  - name: default\n';

/** A replacement Mimir accepts, so a save reaches the handler rather than failing validation. */
const replacement = 'route:\n  receiver: other\nreceivers:\n  - name: other\n';

const ACKNOWLEDGEMENT = 'I understand the consequences, I want to edit the configuration';

/** Renders the editor over the real write hook, which talks to the Mimir MSW handlers. */
function renderEditor(onSaved = vi.fn()) {
  return render(<StoredConfigEditor configuration={configuration} onSaved={onSaved} />, {
    wrapper: createTestWrapper(mockMimirAlertmanagerDs.uid),
  });
}

/** The `alertmanager_config` of the document the last POST stored, if there was one. */
function writtenConfiguration() {
  return parseYaml(getMimirAlertmanagerRawConfig() ?? '').alertmanager_config;
}

/** Acknowledge the warning, which is what makes the editor writable. */
async function unlock() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('checkbox', { name: ACKNOWLEDGEMENT }));

  return user;
}

async function typeConfiguration(text: string) {
  const user = await unlock();
  const editor = screen.getByRole('textbox', { name: 'YAML editor' });

  await user.clear(editor);
  await user.type(editor, text);

  return user;
}

describe('StoredConfigEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setMockGrafanaDataSources();
    setDataSourceSrv(createMockDataSourceSrv());
    setCurrentUserPermissions(AlertingPermission.NotificationsWrite);
    setMimirAlertmanagerRawConfig(storedDocument);
  });

  it('shows the stored configuration', () => {
    renderEditor();

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveValue(configuration);
  });

  it('warns before anything is typed', () => {
    renderEditor();

    expect(screen.getByTestId('data-testid Alert warning')).toBeInTheDocument();
  });

  it('keeps the editor read-only until the warning is acknowledged', async () => {
    renderEditor();

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('readonly');

    await unlock();

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).not.toHaveAttribute('readonly');
  });

  it('locks the editor again when the acknowledgement is withdrawn, keeping the text', async () => {
    renderEditor();

    const user = await typeConfiguration(replacement);
    await user.click(screen.getByRole('checkbox', { name: ACKNOWLEDGEMENT }));

    const editor = screen.getByRole('textbox', { name: 'YAML editor' });
    expect(editor).toHaveAttribute('readonly');
    // Re-locking must not throw away what was typed, only stop it being saved.
    expect(editor).toHaveValue(replacement);
    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeDisabled();
  });

  it('cannot save without changes', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeDisabled();
  });

  it('enables saving as soon as the text changes, without waiting for focus to leave the editor', async () => {
    renderEditor();

    await typeConfiguration(replacement);

    // No blur, no tab away. A disabled button swallows the first click, so it has to be live.
    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeEnabled();
  });

  // Where the problem is gets marked in the editor itself, which is Monaco's doing and so out of
  // reach here. What this can check is that a configuration that does not parse cannot be saved.
  it('cannot save YAML that does not parse', async () => {
    renderEditor();

    await typeConfiguration('route: "unclosed');

    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeDisabled();
  });

  it('only writes once the replacement is confirmed', async () => {
    const onSaved = vi.fn();
    renderEditor(onSaved);

    const user = await typeConfiguration(replacement);
    await user.click(screen.getByRole('button', { name: 'Save configuration' }));

    // The confirmation is up, and nothing has been written yet.
    expect(await screen.findByText('Replace the Alertmanager configuration')).toBeInTheDocument();
    expect(writtenConfiguration()).toBe(configuration);

    await user.click(screen.getByRole('button', { name: 'Replace configuration' }));

    await waitFor(() => expect(writtenConfiguration()).toBe(replacement));
    // The template file the editor never showed is still in the document it saved.
    expect(parseYaml(getMimirAlertmanagerRawConfig() ?? '').template_files).toEqual({
      'default.tmpl': '{{ define "alert.title" }}[{{ .Status }}]{{ end }}\n',
    });
    expect(onSaved).toHaveBeenCalled();
    expect(mocks.notifySuccess).toHaveBeenCalledWith('Alertmanager configuration updated');
  });

  it('writes nothing when the confirmation is dismissed', async () => {
    renderEditor();

    const user = await typeConfiguration(replacement);
    await user.click(screen.getByRole('button', { name: 'Save configuration' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(getMimirAlertmanagerRawConfig()).toBe(storedDocument);
  });

  it('puts the stored configuration back when changes are discarded', async () => {
    renderEditor();

    const user = await typeConfiguration(replacement);
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveValue(configuration);
  });

  it('reports a failed write', async () => {
    server.use(
      http.post('/api/datasources/proxy/uid/:uid/api/v1/alerts', () =>
        HttpResponse.json({ message: 'Mimir said no' }, { status: 400 })
      )
    );
    renderEditor();

    const user = await typeConfiguration(replacement);
    await user.click(screen.getByRole('button', { name: 'Save configuration' }));
    await user.click(screen.getByRole('button', { name: 'Replace configuration' }));

    await waitFor(() => expect(mocks.notifyError).toHaveBeenCalled());
    expect(mocks.notifyError.mock.calls[0][0]).toBe('Failed to update the Alertmanager configuration');
    expect(getMimirAlertmanagerRawConfig()).toBe(storedDocument);
  });
});
