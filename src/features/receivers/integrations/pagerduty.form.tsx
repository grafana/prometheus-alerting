import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { PagerdutyConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface PagerdutyFormProps {
  config: PagerdutyConfig;
  readOnly?: boolean;
}

export function PagerdutyForm({ config, readOnly = false }: PagerdutyFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.pagerduty.routing-key', 'Routing key')}
        description={t('receivers.pagerduty.routing-key-desc', 'PagerDuty integration key')}
      >
        <Input value={config.routing_key ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pagerduty.service-key', 'Service key')}
        description={t('receivers.pagerduty.service-key-desc', 'PagerDuty service key (deprecated)')}
      >
        <Input value={config.service_key ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pagerduty.url', 'URL')}
        description={t('receivers.pagerduty.url-desc', 'PagerDuty API endpoint')}
      >
        <Input value={config.url ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pagerduty.client', 'Client')}
        description={t('receivers.pagerduty.client-desc', 'Client name')}
      >
        <Input value={config.client ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pagerduty.client-url', 'Client URL')}
        description={t('receivers.pagerduty.client-url-desc', 'Client URL')}
      >
        <Input value={config.client_url ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pagerduty.description', 'Description')}
        description={t('receivers.pagerduty.description-desc', 'Incident description')}
      >
        <TextArea value={config.description ?? ''} readOnly={readOnly} rows={3} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pagerduty.severity', 'Severity')}
        description={t('receivers.pagerduty.severity-desc', 'Incident severity level')}
      >
        <Input value={config.severity ?? ''} readOnly={readOnly} />
      </Field>
    </Stack>
  );
}
