import React from 'react';
import { Field, Input, TextArea, Stack } from '@grafana/ui';
import type { SlackConfig } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';

interface SlackFormProps {
  config: SlackConfig;
}

export function SlackForm({ config }: SlackFormProps) {
  return (
    <Stack direction="column" gap={2}>
      <Field
        noMargin
        label={t('receivers.slack.api-url', 'API URL')}
        description={t('receivers.slack.api-url-desc', 'Slack webhook URL')}
      >
        <Input value={config.api_url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.channel', 'Channel')}
        description={t('receivers.slack.channel-desc', 'Slack channel to send notifications to')}
      >
        <Input value={config.channel ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.username', 'Username')}
        description={t('receivers.slack.username-desc', 'Bot username for the notification')}
      >
        <Input value={config.username ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.color', 'Color')}
        description={t('receivers.slack.color-desc', 'Color of the Slack message attachment')}
      >
        <Input value={config.color ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.title', 'Title')}
        description={t('receivers.slack.title-desc', 'Title of the Slack message')}
      >
        <Input value={config.title ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.title-link', 'Title link')}
        description={t('receivers.slack.title-link-desc', 'URL to link the title to')}
      >
        <Input value={config.title_link ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.pretext', 'Pretext')}
        description={t('receivers.slack.pretext-desc', 'Text shown above the message')}
      >
        <TextArea value={config.pretext ?? ''} rows={2} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.text', 'Text')}
        description={t('receivers.slack.text-desc', 'Main message text')}
      >
        <TextArea value={config.text ?? ''} rows={4} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.footer', 'Footer')}
        description={t('receivers.slack.footer-desc', 'Footer text')}
      >
        <Input value={config.footer ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.icon-emoji', 'Icon emoji')}
        description={t('receivers.slack.icon-emoji-desc', 'Emoji to use as the icon')}
      >
        <Input value={config.icon_emoji ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.icon-url', 'Icon URL')}
        description={t('receivers.slack.icon-url-desc', 'URL of an image to use as the icon')}
      >
        <Input value={config.icon_url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.image-url', 'Image URL')}
        description={t('receivers.slack.image-url-desc', 'URL of an image to include in the message')}
      >
        <Input value={config.image_url ?? ''} />
      </Field>

      <Field
        noMargin
        label={t('receivers.slack.thumb-url', 'Thumbnail URL')}
        description={t('receivers.slack.thumb-url-desc', 'URL of a thumbnail image')}
      >
        <Input value={config.thumb_url ?? ''} />
      </Field>
    </Stack>
  );
}
