import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Field, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
type Path = `integrations.${number}.settings.${string}`;
export function DiscordIntegrationForm({ index }: { index: number }) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.discord-settings">Discord settings</Trans>
      </Text>
      <InputField
        register={register}
        name={`${path}.webhook_url`}
        label={t('receivers.form.discord-webhook-url', 'Webhook URL')}
        type="password"
      />
      <InputField register={register} name={`${path}.title`} label={t('receivers.form.discord-title', 'Title')} />
      <Field noMargin label={t('receivers.form.discord-message', 'Message content')}>
        <TextArea
          {...register(`${path}.message`)}
          rows={4}
          aria-label={t('receivers.form.discord-message', 'Message content')}
        />
      </Field>
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.discord-http-config">HTTP configuration</Trans>
          </Text>
          <InputField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.discord-authorization-type', 'Authorization type')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.discord-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.discord-basic-auth-username', 'Basic authentication username')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.discord-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.discord-proxy-url', 'Proxy URL')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.discord-no-proxy', 'No proxy')}
          />
          <Check
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.discord-proxy-from-environment', 'Proxy from environment')}
          />
          <Check
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.discord-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <Check
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.discord-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.discord-tls-server-name', 'TLS server name')}
          />
          <Check
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.discord-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.discord-min-tls-version', 'Minimum TLS version')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.discord-max-tls-version', 'Maximum TLS version')}
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
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: Path;
  label: string;
  type?: string;
}) {
  const { formState, getFieldState } = useFormContext<ReceiverFormValues>();
  const error = getFieldState(name, formState).error?.message;
  return (
    <Field noMargin label={label} invalid={Boolean(error)} error={error}>
      <Input {...register(name)} type={type} aria-label={label} />
    </Field>
  );
}
function Check({ name, label, defaultChecked = false }: { name: Path; label: string; defaultChecked?: boolean }) {
  const { control } = useFormContext<ReceiverFormValues>();
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
