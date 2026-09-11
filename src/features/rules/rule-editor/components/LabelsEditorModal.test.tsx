import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { KVObject } from '../types';
import { LabelsEditorModal } from './LabelsEditorModal';

function renderModal(initialLabels: KVObject[]) {
  const onSave = vi.fn();

  render(<LabelsEditorModal isOpen onClose={() => {}} onSave={onSave} initialLabels={initialLabels} />);

  return {
    onSave,
    key: (number: number) => screen.getByLabelText(`Key for label ${number}`),
    save: () => screen.getByRole('button', { name: 'Save' }),
  };
}

describe('LabelsEditorModal', () => {
  it('refuses to save a repeated key and says so on the repeated row', async () => {
    const modal = renderModal([
      { key: 'team', value: 'backend' },
      { key: 'team', value: 'frontend' },
    ]);

    await userEvent.click(modal.save());

    expect(await screen.findByText('This label key is already used')).toBeInTheDocument();
    expect(modal.onSave).not.toHaveBeenCalled();
  });

  it('saves once the repeated key is changed, and drops the message as it is typed', async () => {
    const modal = renderModal([
      { key: 'team', value: 'backend' },
      { key: 'team', value: 'frontend' },
    ]);

    await userEvent.click(modal.save());
    await screen.findByText('This label key is already used');

    await userEvent.type(modal.key(2), '_owner');

    expect(screen.queryByText('This label key is already used')).not.toBeInTheDocument();

    await userEvent.click(modal.save());

    expect(modal.onSave).toHaveBeenCalledWith([
      { key: 'team', value: 'backend' },
      { key: 'team_owner', value: 'frontend' },
    ]);
  });

  it('saves distinct keys, and empty rows, without complaint', async () => {
    const modal = renderModal([
      { key: 'team', value: 'backend' },
      { key: '', value: '' },
      { key: '', value: '' },
    ]);

    await userEvent.click(modal.save());

    expect(modal.onSave).toHaveBeenCalled();
  });
});
