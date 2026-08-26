import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Stack, Text } from '@grafana/ui';
import { CheckboxField, TextAreaField, TextField } from '../shared/FormFields';

export function WebexIntegrationForm({ index }: { index: number }) {
  const path = webexSettingsPath(index);

  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.webex-settings">Cisco Webex Teams settings</Trans>
      </Text>
      <TextField
        name={`${path}.api_url`}
        label={t('receivers.form.webex-api-url', 'API URL')}
        placeholder={t('receivers.form.webex-api-url-placeholder', 'https://webexapis.com/v1/messages')}
      />
      <TextField name={`${path}.room_id`} label={t('receivers.form.webex-room-id', 'Room ID')} required />
      <TextAreaField name={`${path}.message`} label={t('receivers.form.webex-message', 'Message')} rows={3} />

      <Box marginTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.webex-http-settings">Advanced HTTP settings</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.webex-authorization-type', 'Authorization type')}
            placeholder={t('receivers.form.webex-authorization-type-placeholder', 'Bearer')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.webex-credentials', 'Credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.webex-proxy-url', 'Proxy URL')}
            placeholder={t('receivers.form.webex-proxy-url-placeholder', 'http://proxy.example.com:8080')}
          />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.webex-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.webex-proxy-environment', 'Use proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.webex-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.webex-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.webex-basic-auth-username', 'Username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.webex-basic-auth-password', 'Password')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.webex-server-name', 'Server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.webex-skip-verify', 'Skip verify')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.webex-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.webex-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

function webexSettingsPath(index: number): `integrations.${number}.settings` {
  return `integrations.${index}.settings`;
}
