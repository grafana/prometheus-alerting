import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StoredConfigEditor } from './StoredConfigEditor';

const mocks = vi.hoisted(() => ({
  updateConfiguration: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}));

vi.mock('../hooks/useAlertmanagerConfigYaml', () => ({
  useUpdateAlertmanagerConfigYaml: () => ({
    updateConfiguration: mocks.updateConfiguration,
    isUpdating: false,
  }),
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
          defaultValue={value}
          readOnly={readOnly}
          onChange={(event) => mountedOnChange.current(event.target.value)}
        />
      );
    },
  };
});

const configuration = 'route:\n  receiver: default\n';

const ACKNOWLEDGEMENT = 'I understand the consequences, I want to edit the configuration';

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
    mocks.updateConfiguration.mockResolvedValue({ success: true });
  });

  it('shows the stored configuration', () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveValue(configuration);
  });

  it('warns before anything is typed', () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    expect(screen.getByTestId('data-testid Alert warning')).toBeInTheDocument();
  });

  it('keeps the editor read-only until the warning is acknowledged', async () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveAttribute('readonly');

    await unlock();

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).not.toHaveAttribute('readonly');
  });

  it('locks the editor again when the acknowledgement is withdrawn, keeping the text', async () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    const user = await typeConfiguration('route:\n  receiver: other');
    await user.click(screen.getByRole('checkbox', { name: ACKNOWLEDGEMENT }));

    const editor = screen.getByRole('textbox', { name: 'YAML editor' });
    expect(editor).toHaveAttribute('readonly');
    // Re-locking must not throw away what was typed, only stop it being saved.
    expect(editor).toHaveValue('route:\n  receiver: other');
    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeDisabled();
  });

  it('cannot save without changes', () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeDisabled();
  });

  it('enables saving as soon as the text changes, without waiting for focus to leave the editor', async () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    await typeConfiguration('route:\n  receiver: other');

    // No blur, no tab away. A disabled button swallows the first click, so it has to be live.
    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeEnabled();
  });

  it('cannot save YAML that does not parse', async () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    await typeConfiguration('route: "unclosed');

    expect(await screen.findByText('This is not valid YAML')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save configuration' })).toBeDisabled();
  });

  it('only writes once the replacement is confirmed', async () => {
    const onSaved = vi.fn();
    render(<StoredConfigEditor configuration={configuration} onSaved={onSaved} />);

    const user = await typeConfiguration('route:\n  receiver: other');
    await user.click(screen.getByRole('button', { name: 'Save configuration' }));

    // The confirmation is up, and nothing has been written yet.
    expect(await screen.findByText('Replace the Alertmanager configuration')).toBeInTheDocument();
    expect(mocks.updateConfiguration).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Replace configuration' }));

    await waitFor(() => expect(mocks.updateConfiguration).toHaveBeenCalledWith('route:\n  receiver: other'));
    expect(onSaved).toHaveBeenCalled();
    expect(mocks.notifySuccess).toHaveBeenCalledWith('Alertmanager configuration updated');
  });

  it('writes nothing when the confirmation is dismissed', async () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    const user = await typeConfiguration('route:\n  receiver: other');
    await user.click(screen.getByRole('button', { name: 'Save configuration' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mocks.updateConfiguration).not.toHaveBeenCalled();
  });

  it('puts the stored configuration back when changes are discarded', async () => {
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    const user = await typeConfiguration('route:\n  receiver: other');
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(screen.getByRole('textbox', { name: 'YAML editor' })).toHaveValue(configuration);
  });

  it('reports a failed write', async () => {
    mocks.updateConfiguration.mockRejectedValue(new Error('Mimir said no'));
    render(<StoredConfigEditor configuration={configuration} onSaved={vi.fn()} />);

    const user = await typeConfiguration('route:\n  receiver: other');
    await user.click(screen.getByRole('button', { name: 'Save configuration' }));
    await user.click(screen.getByRole('button', { name: 'Replace configuration' }));

    await waitFor(() =>
      expect(mocks.notifyError).toHaveBeenCalledWith('Failed to update the Alertmanager configuration', 'Mimir said no')
    );
  });
});
