import React from 'react';
import { Field, Input, Stack } from '@grafana/ui';
import type { WebhookConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface WebhookFormProps {
  config: WebhookConfig;
}

export function WebhookForm({ config }: WebhookFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.webhook.url', 'URL')}
        description={t('receivers.webhook.url-desc', 'Webhook endpoint URL')}
      >
        <Input value={config.url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.webhook.max-alerts', 'Max alerts')}
        description={t('receivers.webhook.max-alerts-desc', 'Maximum number of alerts to send in a single request')}
      >
        <Input type="number" value={config.max_alerts ?? ''} />
      </Field>
    </Stack>
  );
}
