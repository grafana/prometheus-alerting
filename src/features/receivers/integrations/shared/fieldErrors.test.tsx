import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { TelegramIntegrationForm } from '../telegram/TelegramIntegrationForm';
import { DiscordIntegrationForm } from '../discord/DiscordIntegrationForm';
import { EmailIntegrationForm } from '../email/EmailIntegrationForm';
import { OpsgenieIntegrationForm } from '../opsgenie/OpsgenieIntegrationForm';
import { PagerDutyIntegrationForm } from '../pagerduty/PagerDutyIntegrationForm';
import { SlackIntegrationForm } from '../slack/SlackIntegrationForm';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
import { createDefaultIntegration } from '../../utils/receiverFormTransform';

const FORMS = {
  telegram: TelegramIntegrationForm,
  discord: DiscordIntegrationForm,
  email: EmailIntegrationForm,
  opsgenie: OpsgenieIntegrationForm,
  pagerduty: PagerDutyIntegrationForm,
  slack: SlackIntegrationForm,
} as const;

/** Renders one integration form with an error already set on the given field. */
function renderWithError(type: keyof typeof FORMS, field: string, message: string) {
  const IntegrationForm = FORMS[type];
  function Harness() {
    const api = useForm<ReceiverFormValues>({
      defaultValues: { name: 'r', integrations: [createDefaultIntegration(type)] },
    });
    React.useEffect(() => {
      api.setError(`integrations.0.settings.${field}`, { type: 'custom', message });
    }, [api]);
    return (
      <FormProvider {...api}>
        <IntegrationForm index={0} />
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

/**
 * A list of actions or a map of headers is a single control on the form, so an error aimed at one
 * row inside it has nothing to attach to and the drawer would refuse to save without saying why.
 * These check the messages land on the control people can actually see.
 */
describe('lists and maps surface errors on the control itself', () => {
  it('shows an error on the Slack actions list', async () => {
    renderWithError('slack', 'actions', 'Every action needs a type');
    expect(await screen.findByText('Every action needs a type')).toBeVisible();
  });

  it('shows an error on the Opsgenie responders list', async () => {
    renderWithError('opsgenie', 'responders', 'Every responder needs an ID, username, or name');
    expect(await screen.findByText('Every responder needs an ID, username, or name')).toBeVisible();
  });

  it('shows an error on the email headers map', async () => {
    renderWithError('email', 'headers', 'Two headers have the same name. Header names ignore capitals.');
    expect(await screen.findByText('Two headers have the same name. Header names ignore capitals.')).toBeVisible();
  });
});

describe('the newly checked fields have somewhere to show their error', () => {
  it('shows the PagerDuty key error on the routing key', async () => {
    renderWithError('pagerduty', 'routing_key', 'Routing key or service key is required');
    expect(await screen.findByText('Routing key or service key is required')).toBeVisible();
  });

  it('shows the no proxy error', async () => {
    renderWithError('discord', 'http_config.no_proxy', 'No proxy needs a proxy URL as well');
    expect(await screen.findByText('No proxy needs a proxy URL as well')).toBeVisible();
  });

  it('shows the TLS version error', async () => {
    renderWithError(
      'discord',
      'http_config.tls_config.min_version',
      'TLS version must be TLS10, TLS11, TLS12 or TLS13'
    );
    expect(await screen.findByText('TLS version must be TLS10, TLS11, TLS12 or TLS13')).toBeVisible();
  });

  it('shows the authorization type error', async () => {
    renderWithError('discord', 'http_config.authorization.type', 'Authorization type cannot be "basic"');
    expect(await screen.findByText('Authorization type cannot be "basic"')).toBeVisible();
  });
});
