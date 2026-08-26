import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Combobox, Field, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
type Path = `integrations.${number}.settings.${string}`;
export function WeChatIntegrationForm({ index }: { index: number }) {
  const { register, control } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={3}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.wechat-settings">WeChat settings</Trans>
      </Text>
      <InputField register={register} name={`${path}.api_url`} label={t('receivers.form.wechat-api-url', 'API URL')} />
      <InputField
        register={register}
        name={`${path}.api_secret`}
        label={t('receivers.form.wechat-api-secret', 'API secret')}
        type="password"
      />
      <InputField register={register} name={`${path}.corp_id`} label={t('receivers.form.wechat-corp-id', 'Corp ID')} />
      <InputField
        register={register}
        name={`${path}.agent_id`}
        label={t('receivers.form.wechat-agent-id', 'Agent ID')}
      />
      <InputField register={register} name={`${path}.to_user`} label={t('receivers.form.wechat-to-user', 'To user')} />
      <InputField
        register={register}
        name={`${path}.to_party`}
        label={t('receivers.form.wechat-to-party', 'To party')}
      />
      <InputField register={register} name={`${path}.to_tag`} label={t('receivers.form.wechat-to-tag', 'To tag')} />
      <Field label={t('receivers.form.wechat-message', 'Message')}>
        <TextArea
          {...register(`${path}.message`)}
          rows={4}
          aria-label={t('receivers.form.wechat-message', 'Message')}
        />
      </Field>
      <Field label={t('receivers.form.wechat-message-type', 'Message type')}>
        <Controller
          name={`${path}.message_type`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <Combobox
              options={[
                { label: t('receivers.form.wechat-text', 'Text'), value: 'text' },
                { label: t('receivers.form.wechat-markdown', 'Markdown'), value: 'markdown' },
              ]}
              value={typeof value === 'string' ? value : 'text'}
              onChange={(selected) => onChange(selected?.value ?? 'text')}
              aria-label={t('receivers.form.wechat-message-type', 'Message type')}
            />
          )}
        />
      </Field>
      <Box paddingTop={1}>
        <Stack direction="column" gap={2}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.wechat-http-config">HTTP configuration</Trans>
          </Text>
          <InputField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.wechat-authorization-type', 'Authorization type')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.wechat-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.wechat-basic-auth-username', 'Basic authentication username')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.wechat-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <InputField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.wechat-proxy-url', 'Proxy URL')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.wechat-no-proxy', 'No proxy')}
          />
          <Check
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.wechat-proxy-from-environment', 'Proxy from environment')}
          />
          <Check
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.wechat-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <Check
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.wechat-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.wechat-tls-server-name', 'TLS server name')}
          />
          <Check
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.wechat-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.wechat-min-tls-version', 'Minimum TLS version')}
          />
          <InputField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.wechat-max-tls-version', 'Maximum TLS version')}
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
    <Field label={label} invalid={Boolean(error)} error={error}>
      <Input {...register(name)} type={type} aria-label={label} />
    </Field>
  );
}
function Check({ name, label, defaultChecked = false }: { name: Path; label: string; defaultChecked?: boolean }) {
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
