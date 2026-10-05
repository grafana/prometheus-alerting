import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rs } from '@rstest/core';

import type { Receiver } from '@grafana/external-alertmanager/vanilla';

import { ReceiverEditForm } from './ReceiverEditForm';

function renderForm(receiver?: Receiver) {
  render(<ReceiverEditForm receiver={receiver} existingReceivers={[]} onSave={rs.fn()} onCancel={rs.fn()} />);
}

describe('every validation error reaches the user', () => {
  it('does not crash the drawer on a config the schema cannot read', () => {
    renderForm({
      name: 'wh',
      webhook_configs: [{ url: 'http://x', http_config: { oauth2: { client_secret: 'shh' } } }],
    } as never);

    expect(screen.getByRole('alert', { name: 'This receiver cannot be edited here' })).toBeVisible();
    // and it must not offer a save button that would overwrite the real receiver with defaults
    expect(screen.queryByRole('button', { name: 'Update receiver' })).not.toBeInTheDocument();
  });

  it('renders nothing extra when every error has a field of its own', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Create receiver' }));

    expect(await screen.findByText('Webhook URL is required')).toBeVisible();
    expect(screen.queryByRole('alert', { name: 'Some settings could not be shown' })).not.toBeInTheDocument();
  });
});
