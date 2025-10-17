import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { WebexConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface WebexFormProps {
  config: WebexConfig;
}

export function WebexForm({ config }: WebexFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.webex.api-url', 'API URL')}
        description={t('receivers.webex.api-url-desc', 'Webex API endpoint')}
      >
        <Input value={config.api_url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.webex.room-id', 'Room ID')}
        description={t('receivers.webex.room-id-desc', 'Webex room ID')}
      >
        <Input value={config.room_id ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.webex.message', 'Message')}
        description={t('receivers.webex.message-desc', 'Message text')}
      >
        <TextArea value={config.message ?? ''} rows={4} />
      </Field>
    </Stack>
  );
}
