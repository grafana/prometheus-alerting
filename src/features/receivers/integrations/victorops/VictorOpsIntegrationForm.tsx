import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Field, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
interface VictorOpsIntegrationFormProps {
  index: number;
}
type VictorOpsFieldPath = `integrations.${number}.settings.${string}`;
export function VictorOpsIntegrationForm({ index }: VictorOpsIntegrationFormProps) {
  const { register } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.victorops-settings">VictorOps settings</Trans>
      </Text>
      <VictorOpsField
        register={register}
        name={`${path}.api_key`}
        label={t('receivers.form.victorops-api-key', 'API key')}
        type="password"
      />
      <VictorOpsField
        register={register}
        name={`${path}.api_url`}
        label={t('receivers.form.victorops-api-url', 'API URL')}
      />
      <VictorOpsField
        register={register}
        name={`${path}.routing_key`}
        label={t('receivers.form.victorops-routing-key', 'Routing key')}
      />
      <VictorOpsField
        register={register}
        name={`${path}.message_type`}
        label={t('receivers.form.victorops-message-type', 'Message type')}
      />
      <VictorOpsField
        register={register}
        name={`${path}.entity_display_name`}
        label={t('receivers.form.victorops-entity-display-name', 'Entity display name')}
      />
      <Field noMargin label={t('receivers.form.victorops-state-message', 'State message')}>
        <TextArea
          {...register(`${path}.state_message`)}
          rows={3}
          aria-label={t('receivers.form.victorops-state-message', 'State message')}
        />
      </Field>
      <VictorOpsField
        register={register}
        name={`${path}.monitoring_tool`}
        label={t('receivers.form.victorops-monitoring-tool', 'Monitoring tool')}
      />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.victorops-http-config">HTTP configuration</Trans>
          </Text>
          <VictorOpsField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.victorops-authorization-type', 'Authorization type')}
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.victorops-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.victorops-basic-auth-username', 'Basic authentication username')}
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.victorops-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.victorops-proxy-url', 'Proxy URL')}
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.victorops-no-proxy', 'No proxy')}
          />
          <VictorOpsCheckbox
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.victorops-proxy-from-environment', 'Proxy from environment')}
          />
          <VictorOpsCheckbox
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.victorops-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <VictorOpsCheckbox
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.victorops-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.victorops-tls-server-name', 'TLS server name')}
          />
          <VictorOpsCheckbox
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.victorops-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.victorops-min-tls-version', 'Minimum TLS version')}
          />
          <VictorOpsField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.victorops-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
function VictorOpsField({
  register,
  name,
  label,
  type = 'text',
}: {
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: VictorOpsFieldPath;
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
function VictorOpsCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: VictorOpsFieldPath;
  label: string;
  defaultChecked?: boolean;
}) {
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
