import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Stack, Text } from '@grafana/ui';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { WebhookSettingsFormValues } from './webhook.schema';

type WebhookFormValues = IntegrationFormValues<WebhookSettingsFormValues>;
const { CheckboxField, TextField } = createFormFields<WebhookFormValues>();

interface WebhookIntegrationFormProps {
  index: number;
}

export function WebhookIntegrationForm({ index }: WebhookIntegrationFormProps) {
  // A receiver is saved as one atomic form containing a heterogeneous integration array. This
  // component owns Webhook fields and schema, while the parent context supplies their root paths.
  const path = webhookSettingsPath(index);

  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.webhook-settings">Webhook settings</Trans>
      </Text>

      <TextField
        name={`${path}.url`}
        label={t('receivers.form.webhook-url', 'URL')}
        placeholder={t('receivers.form.webhook-url-placeholder', 'https://example.com/webhook')}
        required
      />

      <TextField
        name={`${path}.max_alerts`}
        label={t('receivers.form.webhook-max-alerts', 'Max alerts')}
        description={t(
          'receivers.form.webhook-max-alerts-description',
          'Maximum alerts per webhook message. Leave blank to use the Alertmanager default.'
        )}
        inputMode="numeric"
        placeholder={t('receivers.form.webhook-max-alerts-placeholder', '0')}
      />

      <TextField
        name={`${path}.timeout`}
        label={t('receivers.form.webhook-timeout', 'Timeout')}
        placeholder={t('receivers.form.webhook-timeout-placeholder', '10s')}
      />

      <Box marginTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.webhook-http-settings">Advanced HTTP settings</Trans>
          </Text>

          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.webhook-authorization-type', 'Authorization type')}
            placeholder={t('receivers.form.webhook-authorization-type-placeholder', 'Bearer')}
          />

          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.webhook-authorization-credentials', 'Authorization credentials')}
            type="password"
          />

          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.webhook-proxy-url', 'Proxy URL')}
            placeholder={t('receivers.form.webhook-proxy-url-placeholder', 'http://proxy.example.com:8080')}
          />

          <TextField
            name={`${path}.http_config.no_proxy`}
            label={t('receivers.form.webhook-no-proxy', 'No proxy')}
            placeholder={t('receivers.form.webhook-no-proxy-placeholder', 'example.com,.internal')}
          />

          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.webhook-proxy-from-environment', 'Use proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.webhook-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.webhook-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />

          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.webhook-basic-auth-username', 'Username')}
          />

          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.webhook-basic-auth-password', 'Password')}
            type="password"
          />

          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.webhook-tls-server-name', 'Server name')}
          />

          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.webhook-tls-skip-verify', 'Skip verify')}
          />

          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.webhook-tls-min-version', 'Minimum TLS version')}
            placeholder={t('receivers.form.webhook-tls-min-version-placeholder', 'TLS12')}
          />

          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.webhook-tls-max-version', 'Maximum TLS version')}
            placeholder={t('receivers.form.webhook-tls-max-version-placeholder', 'TLS13')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

function webhookSettingsPath(index: number): `integrations.${number}.settings` {
  return `integrations.${index}.settings`;
}
