import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Stack, Text } from '@grafana/ui';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { PushoverSettingsFormValues } from './pushover.schema';

type PushoverFormValues = IntegrationFormValues<PushoverSettingsFormValues>;
const { CheckboxField, TextAreaField, TextField } = createFormFields<PushoverFormValues>();
interface PushoverIntegrationFormProps {
  index: number;
}
export function PushoverIntegrationForm({ index }: PushoverIntegrationFormProps) {
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.pushover-settings">Pushover settings</Trans>
      </Text>
      <TextField name={`${path}.user_key`} label={t('receivers.form.pushover-user-key', 'User key')} type="password" />
      <TextField name={`${path}.token`} label={t('receivers.form.pushover-token', 'Token')} type="password" />
      <TextField name={`${path}.title`} label={t('receivers.form.pushover-title', 'Title')} />
      <TextAreaField name={`${path}.message`} label={t('receivers.form.pushover-message', 'Message')} rows={4} />
      <TextField name={`${path}.url`} label={t('receivers.form.pushover-url', 'URL')} />
      <TextField name={`${path}.url_title`} label={t('receivers.form.pushover-url-title', 'URL title')} />
      <TextField name={`${path}.device`} label={t('receivers.form.pushover-device', 'Device')} />
      <TextField name={`${path}.sound`} label={t('receivers.form.pushover-sound', 'Sound')} />
      <TextField name={`${path}.priority`} label={t('receivers.form.pushover-priority', 'Priority')} />
      <TextField name={`${path}.retry`} label={t('receivers.form.pushover-retry', 'Retry')} />
      <TextField name={`${path}.expire`} label={t('receivers.form.pushover-expire', 'Expire')} />
      <TextField name={`${path}.ttl`} label={t('receivers.form.pushover-ttl', 'TTL')} />
      <CheckboxField name={`${path}.html`} label={t('receivers.form.pushover-html', 'Enable HTML')} />
      <CheckboxField
        name={`${path}.monospace`}
        label={t('receivers.form.pushover-monospace', 'Use monospace formatting')}
      />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.pushover-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.pushover-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.pushover-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.pushover-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.pushover-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.pushover-proxy-url', 'Proxy URL')}
          />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.pushover-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.pushover-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.pushover-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.pushover-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.pushover-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.pushover-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.pushover-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.pushover-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
