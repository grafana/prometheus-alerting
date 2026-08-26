import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { Receiver } from '@grafana/external-alertmanager/vanilla';

import { ReceiverEditForm } from './ReceiverEditForm';

describe('ReceiverEditForm integrations', () => {
  it('shows field-scoped Zod errors for required receiver and webhook values', async () => {
    const user = userEvent.setup();
    render(<ReceiverEditForm existingReceivers={[]} onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Create receiver' }));

    expect(await screen.findByText('Receiver name is required')).toBeVisible();
    expect(screen.getByText('Webhook URL is required')).toBeVisible();
  });

  it('allows removing the final integration and adding one back', async () => {
    const user = userEvent.setup();
    render(<ReceiverEditForm existingReceivers={[]} onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Remove integration' }));
    expect(screen.getByRole('status', { name: 'No integrations' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Add integration' }));
    expect(screen.getByRole('textbox', { name: 'URL' })).toBeVisible();
  });

  it('serializes webhook number input without materializing untouched HTTP defaults', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm existingReceivers={[]} onSave={onSave} onCancel={vi.fn()} />);

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'webhook');
    await user.type(screen.getByRole('textbox', { name: 'URL' }), 'https://example.com/webhook');
    await user.type(screen.getByRole('textbox', { name: 'Max alerts' }), '5');
    await user.click(screen.getByRole('button', { name: 'Create receiver' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        name: 'webhook',
        webhook_configs: [
          {
            send_resolved: true,
            url: 'https://example.com/webhook',
            max_alerts: 5,
          },
        ],
      })
    );
  });

  it('shows a field-scoped Webhook proxy conflict', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'webhook',
      webhook_configs: [
        {
          url: 'https://example.com/webhook',
          http_config: { proxy_url: 'https://proxy.example.com' },
        },
      ],
    } satisfies Receiver;
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.click(screen.getByLabelText('Use proxy from environment'));
    await user.click(screen.getByRole('button', { name: 'Update receiver' }));

    expect(await screen.findByText('Proxy URL and proxy from environment cannot be used together')).toBeVisible();
  });

  it('masks an existing Webex token and migrates legacy bearer auth on save', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'webex',
      webex_configs: [
        {
          room_id: 'room',
          http_config: { bearer_token: 'legacy-token' },
        },
      ],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Credentials')).toHaveValue('legacy-token');
    expect(screen.getByLabelText('Credentials')).toHaveAttribute('type', 'password');
    expect(screen.queryByLabelText('Credentials file')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        name: 'webex',
        webex_configs: [
          {
            send_resolved: true,
            room_id: 'room',
            http_config: {
              authorization: { type: 'Bearer', credentials: 'legacy-token' },
            },
          },
        ],
      })
    );
  });

  it('shows a field-scoped PagerDuty HTTP authentication conflict', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'pagerduty',
      pagerduty_configs: [{ routing_key: 'routing-secret' }],
    } satisfies Receiver;
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Authorization credentials'), 'token');
    await user.type(screen.getByLabelText('Basic authentication username'), 'user');
    await user.click(screen.getByRole('button', { name: 'Update receiver' }));

    expect(await screen.findByText('Authorization and basic authentication cannot be used together')).toBeVisible();
  });

  it('round-trips PagerDuty fields, collections, and masked credentials', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'pagerduty',
      pagerduty_configs: [
        {
          routing_key: 'routing-secret',
          description: 'Incident description',
          severity: 'critical',
          details: { environment: 'production' },
          images: [{ src: 'https://example.com/image.png', alt: 'Graph' }],
          links: [{ href: 'https://example.com/incident', text: 'Open incident' }],
          http_config: { proxy_url: 'https://proxy.example.com' },
        },
      ],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Routing key')).toHaveValue('routing-secret');
    expect(screen.getByLabelText('Routing key')).toHaveAttribute('type', 'password');
    expect(screen.getByDisplayValue('environment')).toBeVisible();
    expect(screen.getByDisplayValue('production')).toBeVisible();
    expect(screen.getByDisplayValue('https://example.com/image.png')).toBeVisible();
    expect(screen.getByDisplayValue('Open incident')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...receiver,
        pagerduty_configs: [{ ...receiver.pagerduty_configs[0], send_resolved: true }],
      })
    );
  });

  it('round-trips Email headers and masked SMTP credentials', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'email',
      email_configs: [
        {
          to: 'alerts@example.com',
          auth_password: 'smtp-secret',
          headers: { 'X-Environment': 'production' },
        },
      ],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Password')).toHaveValue('smtp-secret');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByDisplayValue('X-Environment')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...receiver,
        email_configs: [{ ...receiver.email_configs[0], send_resolved: true }],
      })
    );
  });

  it('round-trips SNS SigV4 credentials and attributes', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'sns',
      sns_configs: [
        {
          topic_arn: 'arn:aws:sns:us-east-1:123456789012:alerts',
          sigv4: { access_key: 'access', secret_key: 'secret' },
          attributes: { severity: 'critical' },
        },
      ],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Secret key')).toHaveValue('secret');
    expect(screen.getByLabelText('Secret key')).toHaveAttribute('type', 'password');
    expect(screen.getByDisplayValue('severity')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...receiver,
        sns_configs: [{ ...receiver.sns_configs[0], send_resolved: true }],
      })
    );
  });

  it('round-trips Slack arrays, actions, and a masked webhook URL', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'slack',
      slack_configs: [
        {
          api_url: 'https://hooks.slack.com/services/secret',
          channel: '#alerts',
          mrkdwn_in: ['text', 'pretext'],
          actions: [{ type: 'button', text: 'Open', url: 'https://example.com' }],
        },
      ],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Webhook URL')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Mrkdwn fields')).toHaveValue('text, pretext');
    expect(screen.getByLabelText('Action text')).toHaveValue('Open');

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...receiver,
        slack_configs: [{ ...receiver.slack_configs[0], send_resolved: false }],
      })
    );
  });

  it('round-trips Discord, Microsoft Teams, WeChat, and Jira typed forms', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'final-typed-batch',
      discord_configs: [{ webhook_url: 'discord-secret', title: 'Discord alert' }],
      msteams_configs: [{ webhook_url: 'teams-secret', title: 'Teams alert' }],
      wechat_configs: [{ api_secret: 'wechat-secret', corp_id: 'corp', message_type: 'markdown' }],
      jira_configs: [
        {
          api_url: 'https://jira.example',
          project: 'OPS',
          issue_type: 'Bug',
          labels: ['alert'],
          fields: { environment: 'prod' },
        },
      ],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getAllByLabelText('Webhook URL')).toHaveLength(2);
    for (const webhookInput of screen.getAllByLabelText('Webhook URL')) {
      expect(webhookInput).toHaveAttribute('type', 'password');
    }
    expect(screen.getByLabelText('API secret')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Project key')).toHaveValue('OPS');
    expect(screen.getByLabelText('Labels')).toHaveValue('alert');
    expect(screen.getByLabelText('Field key')).toHaveValue('environment');

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...receiver,
        discord_configs: [{ ...receiver.discord_configs[0], send_resolved: true }],
        msteams_configs: [{ ...receiver.msteams_configs[0], send_resolved: true }],
        wechat_configs: [{ ...receiver.wechat_configs[0], send_resolved: false }],
        jira_configs: [{ ...receiver.jira_configs[0], send_resolved: true }],
      })
    );
  });

  it('round-trips Opsgenie, Pushover, VictorOps, and Telegram typed forms', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'typed-batch',
      opsgenie_configs: [
        {
          api_key: 'ops-secret',
          message: 'Alert',
          responders: [{ type: 'team', id: 'team-id' }],
        },
      ],
      pushover_configs: [{ user_key: 'user-secret', token: 'token-secret', ttl: '5m30s' }],
      victorops_configs: [{ api_key: 'victor-secret', routing_key: 'team' }],
      telegram_configs: [{ bot_token: 'bot-secret', chat_id: -12345, parse_mode: 'HTML' }],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Bot token')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Chat ID')).toHaveValue('-12345');
    expect(screen.getByLabelText('User key')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Token')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Responder type')).toHaveValue('team');
    expect(screen.getAllByLabelText('API key')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        ...receiver,
        opsgenie_configs: [{ ...receiver.opsgenie_configs[0], send_resolved: true }],
        pushover_configs: [{ ...receiver.pushover_configs[0], send_resolved: true }],
        victorops_configs: [{ ...receiver.victorops_configs[0], send_resolved: true }],
        telegram_configs: [{ ...receiver.telegram_configs[0], send_resolved: true }],
      })
    );
  });

  it('masks an existing basic-auth password and does not wipe it on save', async () => {
    const user = userEvent.setup();
    const receiver = {
      name: 'webhook',
      webhook_configs: [
        {
          url: 'https://example.com/webhook',
          http_config: {
            basic_auth: {
              username: 'user',
              password: 'secret',
            },
          },
        },
      ],
    } satisfies Receiver;
    const onSave = vi.fn<(receiver: Receiver) => Promise<void>>().mockResolvedValue();
    render(<ReceiverEditForm receiver={receiver} existingReceivers={[receiver]} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByLabelText('Password')).toHaveValue('secret');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Update receiver' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        name: 'webhook',
        webhook_configs: [
          {
            send_resolved: true,
            url: 'https://example.com/webhook',
            http_config: {
              basic_auth: {
                username: 'user',
                password: 'secret',
              },
            },
          },
        ],
      })
    );
  });
});
