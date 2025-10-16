import React from 'react';
import { Field, Input, TextArea, Switch, Stack } from '@grafana/ui';
import type { EmailConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface EmailFormProps {
  config: EmailConfig;
  readOnly?: boolean;
}

export function EmailForm({ config, readOnly = false }: EmailFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.email.to', 'To')}
        description={t('receivers.email.to-desc', 'Email address to send notifications to')}
      >
        <Input value={config.to ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.from', 'From')}
        description={t('receivers.email.from-desc', 'Sender email address')}
      >
        <Input value={config.from ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.smarthost', 'SMTP host')}
        description={t('receivers.email.smarthost-desc', 'SMTP server address')}
      >
        <Input value={config.smarthost ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.auth-username', 'Username')}
        description={t('receivers.email.auth-username-desc', 'SMTP authentication username')}
      >
        <Input value={config.auth_username ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.auth-password', 'Password')}
        description={t('receivers.email.auth-password-desc', 'SMTP authentication password')}
      >
        <Input type="password" value={config.auth_password ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.auth-identity', 'Identity')}
        description={t('receivers.email.auth-identity-desc', 'SMTP authentication identity')}
      >
        <Input value={config.auth_identity ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.html', 'HTML body')}
        description={t('receivers.email.html-desc', 'Email body in HTML format')}
      >
        <TextArea value={config.html ?? ''} readOnly={readOnly} rows={4} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.text', 'Text body')}
        description={t('receivers.email.text-desc', 'Email body in plain text format')}
      >
        <TextArea value={config.text ?? ''} readOnly={readOnly} rows={4} />
      </Field>

      <Field
        noMargin
        label={t('receivers.email.require-tls', 'Require TLS')}
        description={t('receivers.email.require-tls-desc', 'Require TLS for SMTP connection')}
      >
        <Switch value={config.require_tls ?? false} disabled={readOnly} />
      </Field>
    </Stack>
  );
}
