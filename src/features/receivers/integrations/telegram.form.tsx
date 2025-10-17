import React from 'react';
import { Field, Input, TextArea, Switch, Stack } from '@grafana/ui';
import type { TelegramConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface TelegramFormProps {
  config: TelegramConfig;
}

export function TelegramForm({ config }: TelegramFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.telegram.api-url', 'API URL')}
        description={t('receivers.telegram.api-url-desc', 'Telegram API endpoint')}
      >
        <Input value={config.api_url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.telegram.bot-token', 'Bot token')}
        description={t('receivers.telegram.bot-token-desc', 'Telegram bot authentication token')}
      >
        <Input type="password" value={config.bot_token ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.telegram.chat-id', 'Chat ID')}
        description={t('receivers.telegram.chat-id-desc', 'Telegram chat ID')}
      >
        <Input type="number" value={config.chat_id ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.telegram.message', 'Message')}
        description={t('receivers.telegram.message-desc', 'Message text')}
      >
        <TextArea value={config.message ?? ''} rows={4} />
      </Field>

      <Field
        noMargin
        label={t('receivers.telegram.parse-mode', 'Parse mode')}
        description={t('receivers.telegram.parse-mode-desc', 'Message parsing mode (Markdown, HTML)')}
      >
        <Input value={config.parse_mode ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.telegram.disable-notifications', 'Disable notifications')}
        description={t('receivers.telegram.disable-notifications-desc', 'Send messages silently')}
      >
        <Switch value={config.disable_notifications ?? false} />
      </Field>
    </Stack>
  );
}
