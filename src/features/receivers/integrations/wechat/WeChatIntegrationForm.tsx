import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { Box, Combobox, Stack, Text } from '@grafana/ui';
import { createFormFields } from '../shared/FormFields';
import type { IntegrationFormValues } from '../../utils/integrationFormTypes';
import type { WeChatSettingsFormValues } from './wechat.schema';

type WeChatFormValues = IntegrationFormValues<WeChatSettingsFormValues>;
const { CheckboxField, ControlledField, TextAreaField, TextField } = createFormFields<WeChatFormValues>();
export function WeChatIntegrationForm({ index }: { index: number }) {
  const path = `integrations.${index}.settings` as const;
  return (
    <Stack direction="column" gap={1}>
      <Text variant="h6">
        <Trans i18nKey="receivers.form.wechat-settings">WeChat settings</Trans>
      </Text>
      <TextField name={`${path}.api_url`} label={t('receivers.form.wechat-api-url', 'API URL')} />
      <TextField
        name={`${path}.api_secret`}
        label={t('receivers.form.wechat-api-secret', 'API secret')}
        type="password"
      />
      <TextField name={`${path}.corp_id`} label={t('receivers.form.wechat-corp-id', 'Corp ID')} />
      <TextField name={`${path}.agent_id`} label={t('receivers.form.wechat-agent-id', 'Agent ID')} />
      <TextField name={`${path}.to_user`} label={t('receivers.form.wechat-to-user', 'To user')} />
      <TextField name={`${path}.to_party`} label={t('receivers.form.wechat-to-party', 'To party')} />
      <TextField name={`${path}.to_tag`} label={t('receivers.form.wechat-to-tag', 'To tag')} />
      <TextAreaField name={`${path}.message`} label={t('receivers.form.wechat-message', 'Message')} rows={4} />
      <ControlledField name={`${path}.message_type`} label={t('receivers.form.wechat-message-type', 'Message type')}>
        {({ value, onChange }) => (
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
      </ControlledField>
      <Box paddingTop={1}>
        <Stack direction="column" gap={1}>
          <Text variant="bodySmall" weight="medium" color="secondary">
            <Trans i18nKey="receivers.form.wechat-http-config">HTTP configuration</Trans>
          </Text>
          <TextField
            name={`${path}.http_config.authorization.type`}
            label={t('receivers.form.wechat-authorization-type', 'Authorization type')}
          />
          <TextField
            name={`${path}.http_config.authorization.credentials`}
            label={t('receivers.form.wechat-authorization-credentials', 'Authorization credentials')}
            type="password"
          />
          <TextField
            name={`${path}.http_config.basic_auth.username`}
            label={t('receivers.form.wechat-basic-auth-username', 'Basic authentication username')}
          />
          <TextField
            name={`${path}.http_config.basic_auth.password`}
            label={t('receivers.form.wechat-basic-auth-password', 'Basic authentication password')}
            type="password"
          />
          <TextField name={`${path}.http_config.proxy_url`} label={t('receivers.form.wechat-proxy-url', 'Proxy URL')} />
          <TextField name={`${path}.http_config.no_proxy`} label={t('receivers.form.wechat-no-proxy', 'No proxy')} />
          <CheckboxField
            name={`${path}.http_config.proxy_from_environment`}
            label={t('receivers.form.wechat-proxy-from-environment', 'Proxy from environment')}
          />
          <CheckboxField
            name={`${path}.http_config.follow_redirects`}
            label={t('receivers.form.wechat-follow-redirects', 'Follow redirects')}
            defaultChecked
          />
          <CheckboxField
            name={`${path}.http_config.enable_http2`}
            label={t('receivers.form.wechat-enable-http2', 'Enable HTTP/2')}
            defaultChecked
          />
          <TextField
            name={`${path}.http_config.tls_config.server_name`}
            label={t('receivers.form.wechat-tls-server-name', 'TLS server name')}
          />
          <CheckboxField
            name={`${path}.http_config.tls_config.insecure_skip_verify`}
            label={t('receivers.form.wechat-tls-skip-verify', 'Skip TLS certificate verification')}
          />
          <TextField
            name={`${path}.http_config.tls_config.min_version`}
            label={t('receivers.form.wechat-min-tls-version', 'Minimum TLS version')}
          />
          <TextField
            name={`${path}.http_config.tls_config.max_version`}
            label={t('receivers.form.wechat-max-tls-version', 'Maximum TLS version')}
          />
        </Stack>
      </Box>
    </Stack>
  );
}
