import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { VictorOpsConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface VictorOpsFormProps {
  config: VictorOpsConfig;
  readOnly?: boolean;
}

export function VictorOpsForm({ config, readOnly = false }: VictorOpsFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.victorops.api-key', 'API key')}
        description={t('receivers.victorops.api-key-desc', 'VictorOps API key')}
      >
        <Input type="password" value={config.api_key ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.victorops.api-url', 'API URL')}
        description={t('receivers.victorops.api-url-desc', 'VictorOps API endpoint')}
      >
        <Input value={config.api_url ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.victorops.routing-key', 'Routing key')}
        description={t('receivers.victorops.routing-key-desc', 'VictorOps routing key')}
      >
        <Input value={config.routing_key ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.victorops.message-type', 'Message type')}
        description={t('receivers.victorops.message-type-desc', 'Message type (CRITICAL, WARNING, INFO)')}
      >
        <Input value={config.message_type ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.victorops.entity-display-name', 'Entity display name')}
        description={t('receivers.victorops.entity-display-name-desc', 'Display name for the entity')}
      >
        <Input value={config.entity_display_name ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.victorops.state-message', 'State message')}
        description={t('receivers.victorops.state-message-desc', 'State message text')}
      >
        <TextArea value={config.state_message ?? ''} readOnly={readOnly} rows={3} />
      </Field>

      <Field
        noMargin
        label={t('receivers.victorops.monitoring-tool', 'Monitoring tool')}
        description={t('receivers.victorops.monitoring-tool-desc', 'Name of the monitoring tool')}
      >
        <Input value={config.monitoring_tool ?? ''} readOnly={readOnly} />
      </Field>
    </Stack>
  );
}
