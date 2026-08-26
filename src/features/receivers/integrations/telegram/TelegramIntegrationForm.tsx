import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Checkbox, Combobox, Field, Input, Stack, Text, TextArea } from '@grafana/ui';
import { Controller, useFormContext } from 'react-hook-form';
import type { ReceiverFormValues } from '../../utils/receiverFormSchema';
interface TelegramIntegrationFormProps {
  index: number;
}
type TelegramFieldPath = `integrations.${number}.settings.${string}`;
export function TelegramIntegrationForm({ index }: TelegramIntegrationFormProps) {
  const { register, control } = useFormContext<ReceiverFormValues>();
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.telegram-settings">Telegram settings</Trans>
      </Text>
      <TelegramField
        register={register}
        name={`${path}.api_url`}
        label={t('receivers.form.telegram-api-url', 'API URL')}
      />
      <TelegramField
        register={register}
        name={`${path}.bot_token`}
        label={t('receivers.form.telegram-bot-token', 'Bot token')}
        type="password"
      />
      <TelegramField
        register={register}
        name={`${path}.chat_id`}
        label={t('receivers.form.telegram-chat-id', 'Chat ID')}
        inputMode="numeric"
      />
      <Field noMargin label={t('receivers.form.telegram-message', 'Message')}>
        <TextArea
          {...register(`${path}.message`)}
          rows={4}
          aria-label={t('receivers.form.telegram-message', 'Message')}
        />
      </Field>
      <TelegramCheckbox
        name={`${path}.disable_notifications`}
        label={t('receivers.form.telegram-disable-notifications', 'Disable notifications')}
      />
      <Field noMargin label={t('receivers.form.telegram-parse-mode', 'Parse mode')}>
        <Controller
          name={`${path}.parse_mode`}
          control={control}
          render={({ field: { value, onChange } }) => (
            <Combobox
              options={[
                { label: t('receivers.form.telegram-parse-none', 'None'), value: '' },
                { label: t('receivers.form.telegram-parse-markdown-v2', 'MarkdownV2'), value: 'MarkdownV2' },
                { label: t('receivers.form.telegram-parse-markdown', 'Markdown'), value: 'Markdown' },
                { label: t('receivers.form.telegram-parse-html', 'HTML'), value: 'HTML' },
              ]}
              value={typeof value === 'string' ? value : ''}
              onChange={(selected) => onChange(selected?.value ?? '')}
              aria-label={t('receivers.form.telegram-parse-mode', 'Parse mode')}
            />
          )}
        />
      </Field>
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.telegram-http-config">HTTP configuration</Trans>
          </Text>
          <TelegramField
            register={register}
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.telegram-authorization-type', 'Authorization type')}
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.telegram-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.telegram-basic-auth-username', 'Basic authentication username')}
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.telegram-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.telegram-proxy-url', 'Proxy URL')}
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.telegram-no-proxy', 'No proxy')}
          />
          <TelegramCheckbox
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.telegram-proxy-from-environment', 'Proxy from environment')}
          />
          <TelegramCheckbox
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.telegram-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <TelegramCheckbox
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.telegram-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.telegram-tls-server-name', 'TLS server name')}
          />
          <TelegramCheckbox
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.telegram-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.telegram-min-tls-version', 'Minimum TLS version')}
          />
          <TelegramField
            register={register}
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.telegram-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
function TelegramField({
  register,
  name,
  label,
  type = 'text',
  inputMode,
}: {
  register: ReturnType<typeof useFormContext<ReceiverFormValues>>['register'];
  name: TelegramFieldPath;
  label: string;
  type?: string;
  inputMode?: 'numeric';
}) {
  const { formState, getFieldState } = useFormContext<ReceiverFormValues>();
  const error = getFieldState(name, formState).error?.message;
  return (
    <Field noMargin label={label} invalid={Boolean(error)} error={error}>
      <Input {...register(name)} type={type} inputMode={inputMode} aria-label={label} />
    </Field>
  );
}
function TelegramCheckbox({
  name,
  label,
  defaultChecked = false,
}: {
  name: TelegramFieldPath;
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
