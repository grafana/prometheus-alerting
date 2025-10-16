import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { MSTeamsConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface MSTeamsFormProps {
  config: MSTeamsConfig;
  readOnly?: boolean;
}

export function MSTeamsForm({ config, readOnly = false }: MSTeamsFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.msteams.webhook-url', 'Webhook URL')}
        description={t('receivers.msteams.webhook-url-desc', 'Microsoft Teams webhook URL')}
      >
        <Input value={config.webhook_url ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.msteams.title', 'Title')}
        description={t('receivers.msteams.title-desc', 'Message title')}
      >
        <Input value={config.title ?? ''} readOnly={readOnly} />
      </Field>

      <Field label={t('receivers.msteams.text', 'Text')} description={t('receivers.msteams.text-desc', 'Message text')}>
        <TextArea value={config.text ?? ''} readOnly={readOnly} rows={4} />
      </Field>
    </Stack>
  );
}
