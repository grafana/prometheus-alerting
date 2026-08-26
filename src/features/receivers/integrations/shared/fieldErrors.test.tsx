import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { TelegramIntegrationForm } from '../telegram/TelegramIntegrationForm';
import { DiscordIntegrationForm } from '../discord/DiscordIntegrationForm';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
import { createDefaultIntegration } from '../../utils/receiverFormTransform';

/** Renders one integration form with an error already set on the given field. */
function renderWithError(type: 'telegram' | 'discord', field: string, message: string) {
  function Harness() {
    const api = useForm<ReceiverFormValues>({
      defaultValues: { name: 'r', integrations: [createDefaultIntegration(type)] },
    });
    React.useEffect(() => {
      api.setError(`integrations.0.settings.${field}`, { type: 'custom', message });
    }, [api]);
    return (
      <FormProvider {...api}>
        {type === 'telegram' ? <TelegramIntegrationForm index={0} /> : <DiscordIntegrationForm index={0} />}
      </FormProvider>
    );
  }
  render(<Harness />);
}

describe('controls surface their own validation errors', () => {
  it('shows an error on a combobox', async () => {
    renderWithError('telegram', 'parse_mode', 'Parse mode is not supported');
    expect(await screen.findByText('Parse mode is not supported')).toBeVisible();
  });

  it('shows an error on a checkbox', async () => {
    renderWithError('discord', 'http_config.proxy_from_environment', 'Cannot combine with a proxy URL');
    expect(await screen.findByText('Cannot combine with a proxy URL')).toBeVisible();
  });

  it('shows an error on a text input', async () => {
    renderWithError('discord', 'webhook_url', 'Webhook URL is required');
    expect(await screen.findByText('Webhook URL is required')).toBeVisible();
  });
});
