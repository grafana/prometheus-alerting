import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Field, Input, Stack, Text } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';

import type { ReceiverFormValues } from '../../utils/receiverFormSchema';

interface WebhookIntegrationFormProps {
  index: number;
}

export function WebhookIntegrationForm({ index }: WebhookIntegrationFormProps) {
  // A receiver is saved as one atomic form containing a heterogeneous integration array. This
  // component owns Webhook fields and schema, while the parent context supplies their root paths.
  const { register, formState, getFieldState } = useFormContext<ReceiverFormValues>();
  const path = webhookSettingsPath(index);
  const error = (fieldPath: `${typeof path}.${string}`) => getFieldState(fieldPath, formState).error?.message;

  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.webhook-settings">Webhook settings</Trans>
      </Text>

      <Field
        noMargin
        label={t('receivers.form.webhook-url', 'URL')}
        required
        invalid={Boolean(error(`${path}.url`))}
        error={error(`${path}.url`)}
      >
        <Input
          {...register(`${path}.url`)}
          placeholder={t('receivers.form.webhook-url-placeholder', 'https://example.com/webhook')}
          aria-label={t('receivers.form.webhook-url', 'URL')}
        />
      </Field>

      <Field
        noMargin
        label={t('receivers.form.webhook-max-alerts', 'Max alerts')}
        description={t(
          'receivers.form.webhook-max-alerts-description',
          'Maximum alerts per webhook message. Leave blank to use the Alertmanager default.'
        )}
        invalid={Boolean(error(`${path}.max_alerts`))}
        error={error(`${path}.max_alerts`)}
      >
        <Input
          {...register(`${path}.max_alerts`)}
          inputMode="numeric"
          placeholder={t('receivers.form.webhook-max-alerts-placeholder', '0')}
          aria-label={t('receivers.form.webhook-max-alerts', 'Max alerts')}
        />
      </Field>

      <Field
        noMargin
        label={t('receivers.form.webhook-timeout', 'Timeout')}
        invalid={Boolean(error(`${path}.timeout`))}
        error={error(`${path}.timeout`)}
      >
        <Input
          {...register(`${path}.timeout`)}
          placeholder={t('receivers.form.webhook-timeout-placeholder', '10s')}
          aria-label={t('receivers.form.webhook-timeout', 'Timeout')}
        />
      </Field>

      <Box marginTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.webhook-http-settings">Advanced HTTP settings</Trans>
          </Text>

          <Field noMargin label={t('receivers.form.webhook-authorization-type', 'Authorization type')}>
            <Input
              {...register(`${path}.http_config.authorization.type`)}
              placeholder={t('receivers.form.webhook-authorization-type-placeholder', 'Bearer')}
              aria-label={t('receivers.form.webhook-authorization-type', 'Authorization type')}
            />
          </Field>

          <Field
            noMargin
            label={t('receivers.form.webhook-authorization-credentials', 'Authorization credentials')}
            invalid={Boolean(error(`${path}.http_config.authorization.credentials`))}
            error={error(`${path}.http_config.authorization.credentials`)}
          >
            <Input
              {...register(`${path}.http_config.authorization.credentials`)}
              type="password"
              aria-label={t('receivers.form.webhook-authorization-credentials', 'Authorization credentials')}
            />
          </Field>

          <Field
            noMargin
            label={t('receivers.form.webhook-proxy-url', 'Proxy URL')}
            invalid={Boolean(error(`${path}.http_config.proxy_url`))}
            error={error(`${path}.http_config.proxy_url`)}
          >
            <Input
              {...register(`${path}.http_config.proxy_url`)}
              placeholder={t('receivers.form.webhook-proxy-url-placeholder', 'http://proxy.example.com:8080')}
              aria-label={t('receivers.form.webhook-proxy-url', 'Proxy URL')}
            />
          </Field>

          <Field noMargin label={t('receivers.form.webhook-no-proxy', 'No proxy')}>
            <Input
              {...register(`${path}.http_config.no_proxy`)}
              placeholder={t('receivers.form.webhook-no-proxy-placeholder', 'example.com,.internal')}
              aria-label={t('receivers.form.webhook-no-proxy', 'No proxy')}
            />
          </Field>

          <WebhookCheckbox
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.webhook-proxy-from-environment', 'Use proxy from environment')}
          />
          <WebhookCheckbox
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.webhook-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <WebhookCheckbox
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.webhook-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />

          <Field noMargin label={t('receivers.form.webhook-basic-auth-username', 'Username')}>
            <Input
              {...register(`${path}.http_config.basic_auth.username`)}
              aria-label={t('receivers.form.webhook-basic-auth-username', 'Username')}
            />
          </Field>

          <Field noMargin label={t('receivers.form.webhook-basic-auth-password', 'Password')}>
            <Input
              {...register(`${path}.http_config.basic_auth.password`)}
              type="password"
              aria-label={t('receivers.form.webhook-basic-auth-password', 'Password')}
            />
          </Field>

          <Field noMargin label={t('receivers.form.webhook-tls-server-name', 'Server name')}>
            <Input
              {...register(`${path}.http_config.tls_config.server_name`)}
              aria-label={t('receivers.form.webhook-tls-server-name', 'Server name')}
            />
          </Field>

          <WebhookCheckbox
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.webhook-tls-skip-verify', 'Skip verify')}
          />

          <Field noMargin label={t('receivers.form.webhook-tls-min-version', 'Minimum TLS version')}>
            <Input
              {...register(`${path}.http_config.tls_config.min_version`)}
              placeholder={t('receivers.form.webhook-tls-min-version-placeholder', 'TLS12')}
              aria-label={t('receivers.form.webhook-tls-min-version', 'Minimum TLS version')}
            />
          </Field>

          <Field noMargin label={t('receivers.form.webhook-tls-max-version', 'Maximum TLS version')}>
            <Input
              {...register(`${path}.http_config.tls_config.max_version`)}
              placeholder={t('receivers.form.webhook-tls-max-version-placeholder', 'TLS13')}
              aria-label={t('receivers.form.webhook-tls-max-version', 'Maximum TLS version')}
            />
          </Field>
        </Stack>
      </Box>
    </Stack>
  );
}

function webhookSettingsPath(index: number): `integrations.${number}.settings` {
  return `integrations.${index}.settings`;
}

type WebhookCheckboxPath =
  | `integrations.${number}.settings.http_config.proxy_from_environment`
  | `integrations.${number}.settings.http_config.follow_redirects`
  | `integrations.${number}.settings.http_config.enable_http2`
  | `integrations.${number}.settings.http_config.tls_config.insecure_skip_verify`;

function WebhookCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: WebhookCheckboxPath;
  label: string;
  defaultChecked?: boolean;
}) {
  const { control } = useFormContext<ReceiverFormValues>();

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
