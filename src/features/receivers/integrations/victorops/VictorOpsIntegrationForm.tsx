import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Stack, Text } from '@grafana/ui';
import { CheckboxField, TextAreaField, TextField } from '../shared/FormFields';
interface VictorOpsIntegrationFormProps {
  index: number;
}
export function VictorOpsIntegrationForm({ index }: VictorOpsIntegrationFormProps) {
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.victorops-settings">VictorOps settings</Trans>
      </Text>
      <TextField name={`${path}.api_key`} label={t('receivers.form.victorops-api-key', 'API key')} type="password" />
      <TextField name={`${path}.api_url`} label={t('receivers.form.victorops-api-url', 'API URL')} />
      <TextField name={`${path}.routing_key`} label={t('receivers.form.victorops-routing-key', 'Routing key')} />
      <TextField name={`${path}.message_type`} label={t('receivers.form.victorops-message-type', 'Message type')} />
      <TextField
        name={`${path}.entity_display_name`}
        label={t('receivers.form.victorops-entity-display-name', 'Entity display name')}
      />
      <TextAreaField
        name={`${path}.state_message`}
        label={t('receivers.form.victorops-state-message', 'State message')}
        rows={3}
      />
      <TextField
        name={`${path}.monitoring_tool`}
        label={t('receivers.form.victorops-monitoring-tool', 'Monitoring tool')}
      />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.victorops-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.victorops-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.victorops-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.victorops-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.victorops-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.victorops-proxy-url', 'Proxy URL')}
          />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.victorops-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.victorops-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.victorops-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.victorops-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.victorops-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.victorops-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.victorops-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.victorops-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
