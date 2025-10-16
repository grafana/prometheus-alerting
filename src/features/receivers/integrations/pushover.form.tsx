import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { PushoverConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface PushoverFormProps {
  config: PushoverConfig;
  readOnly?: boolean;
}

export function PushoverForm({ config, readOnly = false }: PushoverFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.pushover.user-key', 'User key')}
        description={t('receivers.pushover.user-key-desc', 'Pushover user key')}
      >
        <Input value={config.user_key ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pushover.token', 'Token')}
        description={t('receivers.pushover.token-desc', 'Pushover API token')}
      >
        <Input type="password" value={config.token ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pushover.title', 'Title')}
        description={t('receivers.pushover.title-desc', 'Message title')}
      >
        <Input value={config.title ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pushover.message', 'Message')}
        description={t('receivers.pushover.message-desc', 'Message text')}
      >
        <TextArea value={config.message ?? ''} readOnly={readOnly} rows={4} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pushover.url', 'URL')}
        description={t('receivers.pushover.url-desc', 'Supplementary URL')}
      >
        <Input value={config.url ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pushover.priority', 'Priority')}
        description={t('receivers.pushover.priority-desc', 'Message priority (-2 to 2)')}
      >
        <Input value={config.priority ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pushover.retry', 'Retry')}
        description={t('receivers.pushover.retry-desc', 'Retry interval for emergency priority')}
      >
        <Input value={config.retry ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.pushover.expire', 'Expire')}
        description={t('receivers.pushover.expire-desc', 'Expiration time for emergency priority')}
      >
        <Input value={config.expire ?? ''} readOnly={readOnly} />
      </Field>
    </Stack>
  );
}
