import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Field, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, FieldPathByValue, useFormContext } from 'react-hook-form';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { MSTeamsSettingsFormValues } from './msteams.schema';

type MSTeamsFormValues = IntegrationFormValues<MSTeamsSettingsFormValues>;
type TextPath = FieldPathByValue<MSTeamsFormValues, string | undefined>;
type BooleanPath = FieldPathByValue<MSTeamsFormValues, boolean | undefined>;
export function MSTeamsIntegrationForm({ index }: { index: number }) {
  const { register } = useFormContext<MSTeamsFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.msteams-settings">Microsoft Teams settings</Trans>
      </Text>
      <InputField
        register={register}
        name={`${path}.webhook_url`}
        label={t('receivers.form.msteams-webhook-url', 'Webhook URL')}
        type="password"
      />
      <InputField register={register} name={`${path}.title`} label={t('receivers.form.msteams-title', 'Title')} />
      <InputField register={register} name={`${path}.summary`} label={t('receivers.form.msteams-summary', 'Summary')} />
      <Field noMargin label={t('receivers.form.msteams-text', 'Text')}>
        <TextArea {...register(`${path}.text`)} rows={4} aria-label={t('receivers.form.msteams-text', 'Text')} />
      </Field>
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.msteams-http-config">HTTP configuration</Trans>
          </Text>
          <InputField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.msteams-authorization-type', 'Authorization type')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.msteams-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.msteams-basic-auth-username', 'Basic authentication username')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.msteams-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.msteams-proxy-url', 'Proxy URL')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.msteams-no-proxy', 'No proxy')}
          />
          <Check
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.msteams-proxy-from-environment', 'Proxy from environment')}
          />
          <Check
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.msteams-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <Check
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.msteams-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.msteams-tls-server-name', 'TLS server name')}
          />
          <Check
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.msteams-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.msteams-min-tls-version', 'Minimum TLS version')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.msteams-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
function InputField({
  register,
  name,
  label,
  type = 'text',
}: {
  register: ReturnType<typeof useFormContext<MSTeamsFormValues>>['register'];
  name: TextPath;
  label: string;
  type?: string;
}) {
  const { formState, getFieldState } = useFormContext<MSTeamsFormValues>();
  const error = getFieldState(name, formState).error?.message;
  return (
    <Field noMargin label={label} invalid={Boolean(error)} error={error}>
      <Input {...register(name)} type={type} aria-label={label} />
    </Field>
  );
}
function Check({
  name,
  label,
  defaultChecked = false,
}: {
  name: BooleanPath;
  label: string;
  defaultChecked?: boolean;
}) {
  const { control } = useFormContext<MSTeamsFormValues>();
  return (
    <Field noMargin label={label}>
      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Checkbox
            checked={(typeof value === 'boolean' ? value : undefined) ?? defaultChecked}
            onChange={(event) => onChange(event.currentTarget.checked)}
            aria-label={label}
          />
        )}
      />
    </Field>
  );
}
