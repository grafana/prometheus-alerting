import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { DiscordConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface DiscordFormProps {
  config: DiscordConfig;
  readOnly?: boolean;
}

export function DiscordForm({ config, readOnly = false }: DiscordFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.discord.webhook-url', 'Webhook URL')}
        description={t('receivers.discord.webhook-url-desc', 'Discord webhook URL')}
      >
        <Input value={config.webhook_url ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.discord.title', 'Title')}
        description={t('receivers.discord.title-desc', 'Message title')}
      >
        <Input value={config.title ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.discord.message', 'Message')}
        description={t('receivers.discord.message-desc', 'Message text')}
      >
        <TextArea value={config.message ?? ''} readOnly={readOnly} rows={4} />
      </Field>
    </Stack>
  );
}
