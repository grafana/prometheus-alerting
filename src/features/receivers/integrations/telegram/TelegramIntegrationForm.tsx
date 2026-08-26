import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Combobox, Stack, Text } from '@grafana/ui';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { TelegramSettingsFormValues } from './telegram.schema';

type TelegramFormValues = IntegrationFormValues<TelegramSettingsFormValues>;
const { CheckboxField, ControlledField, TextAreaField, TextField } = createFormFields<TelegramFormValues>();
interface TelegramIntegrationFormProps {
  index: number;
}
export function TelegramIntegrationForm({ index }: TelegramIntegrationFormProps) {
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.telegram-settings">Telegram settings</Trans>
      </Text>
      <TextField name={`${path}.api_url`} label={t('receivers.form.telegram-api-url', 'API URL')} />
      <TextField
        name={`${path}.bot_token`}
        label={t('receivers.form.telegram-bot-token', 'Bot token')}
        type="password"
      />
      <TextField name={`${path}.chat_id`} label={t('receivers.form.telegram-chat-id', 'Chat ID')} inputMode="numeric" />
      <TextAreaField name={`${path}.message`} label={t('receivers.form.telegram-message', 'Message')} rows={4} />
      <CheckboxField
        name={`${path}.disable_notifications`}
        label={t('receivers.form.telegram-disable-notifications', 'Disable notifications')}
      />
      <ControlledField name={`${path}.parse_mode`} label={t('receivers.form.telegram-parse-mode', 'Parse mode')}>
        {({ value, onChange }) => (
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
      </ControlledField>
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.telegram-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.telegram-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.telegram-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.telegram-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.telegram-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.telegram-proxy-url', 'Proxy URL')}
          />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.telegram-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.telegram-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.telegram-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.telegram-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.telegram-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.telegram-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.telegram-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.telegram-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
