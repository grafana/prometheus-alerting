import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Field, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
interface PushoverIntegrationFormProps {
  index: number;
}
type PushoverFieldPath = `integrations.${number}.settings.${string}`;
export function PushoverIntegrationForm({ index }: PushoverIntegrationFormProps) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={3}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.pushover-settings">Pushover settings</Trans>
      </Text>
      <PushoverField
        register={register}
        name={`${path}.user_key`}
        label={t('receivers.form.pushover-user-key', 'User key')}
        type="password"
      />
      <PushoverField
        register={register}
        name={`${path}.token`}
        label={t('receivers.form.pushover-token', 'Token')}
        type="password"
      />
      <PushoverField register={register} name={`${path}.title`} label={t('receivers.form.pushover-title', 'Title')} />
      <Field label={t('receivers.form.pushover-message', 'Message')}>
        <TextArea
          {...register(`${path}.message`)}
          rows={4}
          aria-label={t('receivers.form.pushover-message', 'Message')}
        />
      </Field>
      <PushoverField register={register} name={`${path}.url`} label={t('receivers.form.pushover-url', 'URL')} />
      <PushoverField
        register={register}
        name={`${path}.url_title`}
        label={t('receivers.form.pushover-url-title', 'URL title')}
      />
      <PushoverField
        register={register}
        name={`${path}.device`}
        label={t('receivers.form.pushover-device', 'Device')}
      />
      <PushoverField register={register} name={`${path}.sound`} label={t('receivers.form.pushover-sound', 'Sound')} />
      <PushoverField
        register={register}
        name={`${path}.priority`}
        label={t('receivers.form.pushover-priority', 'Priority')}
      />
      <PushoverField register={register} name={`${path}.retry`} label={t('receivers.form.pushover-retry', 'Retry')} />
      <PushoverField
        register={register}
        name={`${path}.expire`}
        label={t('receivers.form.pushover-expire', 'Expire')}
      />
      <PushoverField register={register} name={`${path}.ttl`} label={t('receivers.form.pushover-ttl', 'TTL')} />
      <PushoverCheckbox name={`${path}.html`} label={t('receivers.form.pushover-html', 'Enable HTML')} />
      <PushoverCheckbox
        name={`${path}.monospace`}
        label={t('receivers.form.pushover-monospace', 'Use monospace formatting')}
      />
      <Box paddingTop={1}>
        <Stack direction="column" gap={2}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.pushover-http-config">HTTP configuration</Trans>
          </Text>
          <PushoverField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.pushover-authorization-type', 'Authorization type')}
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.pushover-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.pushover-basic-auth-username', 'Basic authentication username')}
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.pushover-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.pushover-proxy-url', 'Proxy URL')}
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.pushover-no-proxy', 'No proxy')}
          />
          <PushoverCheckbox
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.pushover-proxy-from-environment', 'Proxy from environment')}
          />
          <PushoverCheckbox
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.pushover-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <PushoverCheckbox
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.pushover-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.pushover-tls-server-name', 'TLS server name')}
          />
          <PushoverCheckbox
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.pushover-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.pushover-min-tls-version', 'Minimum TLS version')}
          />
          <PushoverField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.pushover-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
function PushoverField({
  register,
  name,
  label,
  type = 'text',
}: {
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: PushoverFieldPath;
  label: string;
  type?: string;
}) {
  const { formState, getFieldState } = useFormContext<ReceiverFormValues>();
  const error = getFieldState(name, formState).error?.message;
  return (
    <Field label={label} invalid={Boolean(error)} error={error}>
      <Input {...register(name)} type={type} aria-label={label} />
    </Field>
  );
}
function PushoverCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: PushoverFieldPath;
  label: string;
  defaultChecked?: boolean;
}) {
  const { control } = useFormContext<ReceiverFormValues>();
  return (
    <Field label={label}>
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
