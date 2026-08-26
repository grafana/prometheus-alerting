import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Field, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, FieldPath, FieldPathByValue, useFormContext } from 'react-hook-form';

import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { WebexSettingsFormValues } from './webex.schema';

type WebexFormValues = IntegrationFormValues<WebexSettingsFormValues>;

export function WebexIntegrationForm({ index }: { index: number }) {
  const { register, formState, getFieldState } = useFormContext<WebexFormValues>();
  const path = webexSettingsPath(index);
  const error = (fieldPath: FieldPath<WebexFormValues>) => getFieldState(fieldPath, formState).error?.message;

  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.webex-settings">Cisco Webex Teams settings</Trans>
      </Text>
      <Field noMargin label={t('receivers.form.webex-api-url', 'API URL')}>
        <Input
          {...register(`${path}.api_url`)}
          placeholder={t('receivers.form.webex-api-url-placeholder', 'https://webexapis.com/v1/messages')}
          aria-label={t('receivers.form.webex-api-url', 'API URL')}
        />
      </Field>
      <Field
        noMargin
        label={t('receivers.form.webex-room-id', 'Room ID')}
        required
        invalid={Boolean(error(`${path}.room_id`))}
        error={error(`${path}.room_id`)}
      >
        <Input {...register(`${path}.room_id`)} aria-label={t('receivers.form.webex-room-id', 'Room ID')} />
      </Field>
      <Field noMargin label={t('receivers.form.webex-message', 'Message')}>
        <TextArea {...register(`${path}.message`)} rows={3} aria-label={t('receivers.form.webex-message', 'Message')} />
      </Field>

      <Box marginTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.webex-http-settings">Advanced HTTP settings</Trans>
          </Text>
          <Field noMargin label={t('receivers.form.webex-authorization-type', 'Authorization type')}>
            <Input
              {...register(`${path}.http_config.authorization.type`)}
              placeholder={t('receivers.form.webex-authorization-type-placeholder', 'Bearer')}
              aria-label={t('receivers.form.webex-authorization-type', 'Authorization type')}
            />
          </Field>
          <Field
            noMargin
            label={t('receivers.form.webex-credentials', 'Credentials')}
            invalid={Boolean(error(`${path}.http_config.authorization.credentials`))}
            error={error(`${path}.http_config.authorization.credentials`)}
          >
            <Input
              {...register(`${path}.http_config.authorization.credentials`)}
              type="password"
              aria-label={t('receivers.form.webex-credentials', 'Credentials')}
            />
          </Field>
          <Field
            noMargin
            label={t('receivers.form.webex-proxy-url', 'Proxy URL')}
            invalid={Boolean(error(`${path}.http_config.proxy_url`))}
            error={error(`${path}.http_config.proxy_url`)}
          >
            <Input
              {...register(`${path}.http_config.proxy_url`)}
              placeholder={t('receivers.form.webex-proxy-url-placeholder', 'http://proxy.example.com:8080')}
              aria-label={t('receivers.form.webex-proxy-url', 'Proxy URL')}
            />
          </Field>
          <Field noMargin label={t('receivers.form.webex-no-proxy', 'No proxy')}>
            <Input
              {...register(`${path}.http_config.no_proxy`)}
              aria-label={t('receivers.form.webex-no-proxy', 'No proxy')}
            />
          </Field>
          <WebexCheckbox
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.webex-proxy-environment', 'Use proxy from environment')}
          />
          <WebexCheckbox
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.webex-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <WebexCheckbox
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.webex-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <Field noMargin label={t('receivers.form.webex-basic-auth-username', 'Username')}>
            <Input
              {...register(`${path}.http_config.basic_auth.username`)}
              aria-label={t('receivers.form.webex-basic-auth-username', 'Username')}
            />
          </Field>
          <Field noMargin label={t('receivers.form.webex-basic-auth-password', 'Password')}>
            <Input
              {...register(`${path}.http_config.basic_auth.password`)}
              type="password"
              aria-label={t('receivers.form.webex-basic-auth-password', 'Password')}
            />
          </Field>
          <Field noMargin label={t('receivers.form.webex-server-name', 'Server name')}>
            <Input
              {...register(`${path}.http_config.tls_config.server_name`)}
              aria-label={t('receivers.form.webex-server-name', 'Server name')}
            />
          </Field>
          <WebexCheckbox
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.webex-skip-verify', 'Skip verify')}
          />
          <Field noMargin label={t('receivers.form.webex-min-tls-version', 'Minimum TLS version')}>
            <Input
              {...register(`${path}.http_config.tls_config.min_version`)}
              aria-label={t('receivers.form.webex-min-tls-version', 'Minimum TLS version')}
            />
          </Field>
          <Field noMargin label={t('receivers.form.webex-max-tls-version', 'Maximum TLS version')}>
            <Input
              {...register(`${path}.http_config.tls_config.max_version`)}
              aria-label={t('receivers.form.webex-max-tls-version', 'Maximum TLS version')}
            />
          </Field>
        </Stack>
      </Box>
    </Stack>
  );
}

function webexSettingsPath(index: number): `integrations.${number}.settings` {
  return `integrations.${index}.settings`;
}

type WebexCheckboxPath = FieldPathByValue<WebexFormValues, boolean | undefined>;

function WebexCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: WebexCheckboxPath;
  label: string;
  defaultChecked?: boolean;
}) {
  const { control } = useFormContext<WebexFormValues>();
  return (
    <Field noMargin label={label}>
      <Controller
        name={name}
        control={control}
        render={({ field: { onChange, value } }) => (
          <Checkbox
            checked={value ?? defaultChecked}
            onChange={(event) => onChange(event.currentTarget.checked)}
            aria-label={label}
          />
        )}
      />
    </Field>
  );
}
