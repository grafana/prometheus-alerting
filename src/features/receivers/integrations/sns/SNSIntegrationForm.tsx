import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Button, Field, IconButton, Input, Stack, Text, TextArea } from '@grafana/ui';
import { useFormContext, type FieldPath } from 'react-hook-form';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { SNSSettingsFormValues } from './sns.schema';

type SNSFormValues = IntegrationFormValues<SNSSettingsFormValues>;
const { CheckboxField, ControlledField, TextField } = createFormFields<SNSFormValues>();

import type { ReceiverFormValues } from '../../utils/receiverFormSchema';

interface SNSIntegrationFormProps {
  index: number;
}
type SNSFieldPath = FieldPath<SNSFormValues>;

export function SNSIntegrationForm({ index }: SNSIntegrationFormProps) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.sns-settings">Amazon SNS settings</Trans>
      </Text>
      <TextField name={`${path}.api_url`} label={t('receivers.form.sns-api-url', 'API URL')} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.sns-sigv4">SigV4 authentication</Trans>
          </Text>
          <TextField name={`${path}.sigv4.region`} label={t('receivers.form.sns-region', 'Region')} />
          <TextField name={`${path}.sigv4.access_key`} label={t('receivers.form.sns-access-key', 'Access key')} />
          <TextField
            name={`${path}.sigv4.secret_key`}
            label={t('receivers.form.sns-secret-key', 'Secret key')}
            type="password"
          />
          <TextField name={`${path}.sigv4.profile`} label={t('receivers.form.sns-profile', 'Profile')} />
          <TextField name={`${path}.sigv4.role_arn`} label={t('receivers.form.sns-role-arn', 'Role ARN')} />
        </Stack>
      </Box>
      <TextField name={`${path}.topic_arn`} label={t('receivers.form.sns-topic-arn', 'SNS topic ARN')} />
      <TextField name={`${path}.phone_number`} label={t('receivers.form.sns-phone-number', 'Phone number')} />
      <TextField name={`${path}.target_arn`} label={t('receivers.form.sns-target-arn', 'Target ARN')} />
      <TextField
        name={`${path}.subject`}
        label={t('receivers.form.sns-subject', 'Subject')}
        placeholder={t('receivers.form.sns-subject-placeholder', '{{ template "sns.default.subject" . }}')}
      />
      <Field noMargin label={t('receivers.form.sns-message', 'Message')}>
        <TextArea
          {...register(`${path}.message`)}
          rows={4}
          placeholder={t('receivers.form.sns-message-placeholder', '{{ template "sns.default.message" . }}')}
          aria-label={t('receivers.form.sns-message', 'Message')}
        />
      </Field>
      <SNSKeyValueMap name={`${path}.attributes`} label={t('receivers.form.sns-attributes', 'Attributes')} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.sns-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.sns-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.sns-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.sns-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.sns-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField name={`${path}.http_config.proxy_url`} label={t('receivers.form.sns-proxy-url', 'Proxy URL')} />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.sns-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.sns-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.sns-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.sns-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.sns-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.sns-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.sns-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.sns-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

function SNSKeyValueMap({ name, label }: { name: SNSFieldPath; label: string }) {
  return (
    <ControlledField name={name} label={label}>
      {({ value, onChange }) => {
        const entries = isStringRecord(value) ? Object.entries(value) : [];
        return (
          <Stack direction="column" gap={1}>
            {entries.map(([key, entryValue], entryIndex) => (
              <Stack key={`${key}-${entryIndex}`} direction="row" gap={1}>
                <Input
                  value={key}
                  aria-label={t('receivers.form.sns-attribute-key', 'Attribute key')}
                  onChange={(event) =>
                    onChange(
                      Object.fromEntries(
                        entries.map(([currentKey, currentValue], index) => [
                          index === entryIndex ? event.currentTarget.value : currentKey,
                          currentValue,
                        ])
                      )
                    )
                  }
                />
                <Input
                  value={entryValue}
                  aria-label={t('receivers.form.sns-attribute-value', 'Attribute value')}
                  onChange={(event) =>
                    onChange(
                      Object.fromEntries(
                        entries.map(([currentKey, currentValue], index) => [
                          currentKey,
                          index === entryIndex ? event.currentTarget.value : currentValue,
                        ])
                      )
                    )
                  }
                />
                <IconButton
                  name="trash-alt"
                  type="button"
                  tooltip={t('receivers.form.remove-sns-attribute', 'Remove attribute')}
                  onClick={() => onChange(Object.fromEntries(entries.filter((_, index) => index !== entryIndex)))}
                />
              </Stack>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => onChange({ ...Object.fromEntries(entries), [`key${entries.length + 1}`]: '' })}
            >
              <Trans i18nKey="receivers.form.add-sns-attribute">Add attribute</Trans>
            </Button>
          </Stack>
        );
      }}
    </ControlledField>
  );
}
function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}
