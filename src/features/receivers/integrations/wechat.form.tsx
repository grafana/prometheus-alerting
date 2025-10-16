import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { WechatConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface WechatFormProps {
  config: WechatConfig;
}

export function WechatForm({ config }: WechatFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.wechat.api-url', 'API URL')}
        description={t('receivers.wechat.api-url-desc', 'WeChat API endpoint')}
      >
        <Input value={config.api_url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.wechat.corp-id', 'Corp ID')}
        description={t('receivers.wechat.corp-id-desc', 'WeChat Work corp ID')}
      >
        <Input value={config.corp_id ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.wechat.agent-id', 'Agent ID')}
        description={t('receivers.wechat.agent-id-desc', 'WeChat Work agent ID')}
      >
        <Input value={config.agent_id ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.wechat.api-secret', 'API secret')}
        description={t('receivers.wechat.api-secret-desc', 'WeChat Work API secret')}
      >
        <Input type="password" value={config.api_secret ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.wechat.to-user', 'To user')}
        description={t('receivers.wechat.to-user-desc', 'Target user IDs (pipe-separated)')}
      >
        <Input value={config.to_user ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.wechat.to-party', 'To party')}
        description={t('receivers.wechat.to-party-desc', 'Target party IDs (pipe-separated)')}
      >
        <Input value={config.to_party ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.wechat.to-tag', 'To tag')}
        description={t('receivers.wechat.to-tag-desc', 'Target tag IDs (pipe-separated)')}
      >
        <Input value={config.to_tag ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.wechat.message', 'Message')}
        description={t('receivers.wechat.message-desc', 'Message text')}
      >
        <TextArea value={config.message ?? ''} rows={4} />
      </Field>
    </Stack>
  );
}
