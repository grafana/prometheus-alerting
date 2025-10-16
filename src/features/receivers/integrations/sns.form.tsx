import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { SNSConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface SNSFormProps {
  config: SNSConfig;
  readOnly?: boolean;
}

export function SNSForm({ config, readOnly = false }: SNSFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.sns.topic-arn', 'Topic ARN')}
        description={t('receivers.sns.topic-arn-desc', 'AWS SNS topic ARN')}
      >
        <Input value={config.topic_arn ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.sns.phone-number', 'Phone number')}
        description={t('receivers.sns.phone-number-desc', 'Phone number for SMS delivery')}
      >
        <Input value={config.phone_number ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.sns.target-arn', 'Target ARN')}
        description={t('receivers.sns.target-arn-desc', 'AWS SNS target ARN')}
      >
        <Input value={config.target_arn ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.sns.subject', 'Subject')}
        description={t('receivers.sns.subject-desc', 'Message subject')}
      >
        <Input value={config.subject ?? ''} readOnly={readOnly} />
      </Field>

      <Field
        noMargin
        label={t('receivers.sns.message', 'Message')}
        description={t('receivers.sns.message-desc', 'Message text')}
      >
        <TextArea value={config.message ?? ''} readOnly={readOnly} rows={4} />
      </Field>
    </Stack>
  );
}
