import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { OpsGenieConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface OpsGenieFormProps {
  config: OpsGenieConfig;
  readOnly?: boolean;
}

export function OpsGenieForm({ config, readOnly = false }: OpsGenieFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.opsgenie.api-key', 'API key')}
        description={t('receivers.opsgenie.api-key-desc', 'OpsGenie API key')}
      >
        <Input type="password" value={config.api_key ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.opsgenie.api-url', 'API URL')}
        description={t('receivers.opsgenie.api-url-desc', 'OpsGenie API endpoint')}
      >
        <Input value={config.api_url ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.opsgenie.message', 'Message')}
        description={t('receivers.opsgenie.message-desc', 'Alert message')}
      >
        <Input value={config.message ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.opsgenie.description', 'Description')}
        description={t('receivers.opsgenie.description-desc', 'Alert description')}
      >
        <TextArea value={config.description ?? ''} readOnly={readOnly} rows={3} />
      </Field>

      <Field
        noMargin
        label={t('receivers.opsgenie.source', 'Source')}
        description={t('receivers.opsgenie.source-desc', 'Source of the alert')}
      >
        <Input value={config.source ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.opsgenie.tags', 'Tags')}
        description={t('receivers.opsgenie.tags-desc', 'Comma-separated list of tags')}
      >
        <Input value={config.tags ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.opsgenie.priority', 'Priority')}
        description={t('receivers.opsgenie.priority-desc', 'Alert priority (P1-P5)')}
      >
        <Input value={config.priority ?? ''} readOnly={readOnly} />
      </Field>
    </Stack>
  );
}
