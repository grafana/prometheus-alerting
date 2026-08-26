import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Stack, Text } from '@grafana/ui';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { MSTeamsSettingsFormValues } from './msteams.schema';

type MSTeamsFormValues = IntegrationFormValues<MSTeamsSettingsFormValues>;
const { CheckboxField, TextAreaField, TextField } = createFormFields<MSTeamsFormValues>();
export function MSTeamsIntegrationForm({ index }: { index: number }) {
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.msteams-settings">Microsoft Teams settings</Trans>
      </Text>
      <TextField
        name={`${path}.webhook_url`}
        label={t('receivers.form.msteams-webhook-url', 'Webhook URL')}
        type="password"
      />
      <TextField name={`${path}.title`} label={t('receivers.form.msteams-title', 'Title')} />
      <TextField name={`${path}.summary`} label={t('receivers.form.msteams-summary', 'Summary')} />
      <TextAreaField name={`${path}.text`} label={t('receivers.form.msteams-text', 'Text')} rows={4} />
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.msteams-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.msteams-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.msteams-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.msteams-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.msteams-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.proxy_url`}
            label={t('receivers.form.msteams-proxy-url', 'Proxy URL')}
          />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.msteams-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.msteams-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.msteams-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.msteams-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.msteams-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.msteams-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.msteams-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.msteams-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
