import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { DiscordConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface DiscordFormProps {
  config: DiscordConfig;
}

export function DiscordForm({ config }: DiscordFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.discord.webhook-url', 'Webhook URL')}
        description={t('receivers.discord.webhook-url-desc', 'Discord webhook URL')}
      >
        <Input value={config.webhook_url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.discord.title', 'Title')}
        description={t('receivers.discord.title-desc', 'Message title')}
      >
        <Input value={config.title ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.discord.message', 'Message')}
        description={t('receivers.discord.message-desc', 'Message text')}
      >
        <TextArea value={config.message ?? ''} rows={4} />
      </Field>
    </Stack>
  );
}
