import { css } from '@emotion/css';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { LinkButton, Stack, Field, Input, useStyles2, FieldSet, EmptyState, Alert } from '@grafana/ui';
import { testIds } from '../../../components/testIds';
import { useReceivers } from '../hooks/useReceivers';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { AlertmanagerError } from '../../../components/AlertmanagerError';
import { prefixRoute } from '../../../utils/utils.routing';
import { ROUTES } from '../../../constants';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import {
  EmailForm,
  SlackForm,
  WebhookForm,
  PagerdutyForm,
  OpsGenieForm,
  DiscordForm,
  TelegramForm,
  MSTeamsForm,
  WebexForm,
  PushoverForm,
  VictorOpsForm,
  WechatForm,
  SNSForm,
} from '../integrations';

interface IntegrationItemProps {
  type: string;
  config: unknown;
}

function IntegrationItem({ type, config }: IntegrationItemProps) {
  const styles = useStyles2(getStyles);

  const renderIntegrationForm = () => {
    switch (type) {
      case 'email':
        return <EmailForm config={config as Parameters<typeof EmailForm>[0]['config']} />;
      case 'slack':
        return <SlackForm config={config as Parameters<typeof SlackForm>[0]['config']} />;
      case 'webhook':
        return <WebhookForm config={config as Parameters<typeof WebhookForm>[0]['config']} />;
      case 'pagerduty':
        return <PagerdutyForm config={config as Parameters<typeof PagerdutyForm>[0]['config']} />;
      case 'opsgenie':
        return <OpsGenieForm config={config as Parameters<typeof OpsGenieForm>[0]['config']} />;
      case 'discord':
        return <DiscordForm config={config as Parameters<typeof DiscordForm>[0]['config']} />;
      case 'telegram':
        return <TelegramForm config={config as Parameters<typeof TelegramForm>[0]['config']} />;
      case 'msteams':
        return <MSTeamsForm config={config as Parameters<typeof MSTeamsForm>[0]['config']} />;
      case 'webex':
        return <WebexForm config={config as Parameters<typeof WebexForm>[0]['config']} />;
      case 'pushover':
        return <PushoverForm config={config as Parameters<typeof PushoverForm>[0]['config']} />;
      case 'victorops':
        return <VictorOpsForm config={config as Parameters<typeof VictorOpsForm>[0]['config']} />;
      case 'wechat':
        return <WechatForm config={config as Parameters<typeof WechatForm>[0]['config']} />;
      case 'sns':
        return <SNSForm config={config as Parameters<typeof SNSForm>[0]['config']} />;
      default:
        return (
          <Alert title={t('receivers.integration.unknown', 'Unknown integration type')} severity="warning">
            {t('receivers.integration.unknown-desc', 'Integration type "{{type}}" is not supported', { type })}
          </Alert>
        );
    }
  };

  return (
    <FieldSet label={type} style={{ marginBottom: 0 }} disabled={true}>
      <div className={styles.integrationConfigurationWrapper}>{renderIntegrationForm()}</div>
    </FieldSet>
  );
}

interface ReceiverIntegrationsProps {
  receiver: Receiver;
}

function ReceiverIntegrations({ receiver }: ReceiverIntegrationsProps) {
  const integrations: Array<{ type: string; config: unknown }> = [];

  // Collect all integrations from the receiver
  if (receiver.email_configs) {
    receiver.email_configs.forEach((config) => integrations.push({ type: 'email', config }));
  }
  if (receiver.slack_configs) {
    receiver.slack_configs.forEach((config) => integrations.push({ type: 'slack', config }));
  }
  if (receiver.webhook_configs) {
    receiver.webhook_configs.forEach((config) => integrations.push({ type: 'webhook', config }));
  }
  if (receiver.pagerduty_configs) {
    receiver.pagerduty_configs.forEach((config) => integrations.push({ type: 'pagerduty', config }));
  }
  if (receiver.opsgenie_configs) {
    receiver.opsgenie_configs.forEach((config) => integrations.push({ type: 'opsgenie', config }));
  }
  if (receiver.discord_configs) {
    receiver.discord_configs.forEach((config) => integrations.push({ type: 'discord', config }));
  }
  if (receiver.telegram_configs) {
    receiver.telegram_configs.forEach((config) => integrations.push({ type: 'telegram', config }));
  }
  if (receiver.msteams_configs) {
    receiver.msteams_configs.forEach((config) => integrations.push({ type: 'msteams', config }));
  }
  if (receiver.webex_configs) {
    receiver.webex_configs.forEach((config) => integrations.push({ type: 'webex', config }));
  }
  if (receiver.pushover_configs) {
    receiver.pushover_configs.forEach((config) => integrations.push({ type: 'pushover', config }));
  }
  if (receiver.victorops_configs) {
    receiver.victorops_configs.forEach((config) => integrations.push({ type: 'victorops', config }));
  }
  if (receiver.wechat_configs) {
    receiver.wechat_configs.forEach((config) => integrations.push({ type: 'wechat', config }));
  }
  if (receiver.sns_configs) {
    receiver.sns_configs.forEach((config) => integrations.push({ type: 'sns', config }));
  }

  if (integrations.length === 0) {
    return (
      <Alert title={t('receivers.no-integrations', 'No integrations')} severity="info">
        {t('receivers.no-integrations-desc', 'This receiver has no integrations configured.')}
      </Alert>
    );
  }

  return integrations.map((integration, index) => (
    <IntegrationItem key={`${integration.type}-${index}`} type={integration.type} config={integration.config} />
  ));
}

function ReceiverDetail() {
  const { name } = useParams<{ name: string }>();
  const [triggerFetch, { receivers = [], isLoading, error }] = useReceivers();
  const styles = useStyles2(getStyles);

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const receiver = receivers.find((r: Receiver) => r.name === name);

  // If loading is complete and receiver not found, show error
  const notFound = !isLoading && !receiver && !error;

  return (
    <AlertmanagerPage
      subTitle={name ? t('receivers.detail.subtitle', 'Receiver: {{name}}', { name }) : undefined}
      actions={
        <LinkButton icon="arrow-left" variant="secondary" href={prefixRoute(ROUTES.Receivers)}>
          {t('receivers.detail.back', 'Back to receivers')}
        </LinkButton>
      }
    >
      <div data-testid={testIds.receivers.detail} className={styles.wrapper}>
        {isLoading && <Skeleton height={24} count={10} />}
        {error && (
          <AlertmanagerError error={error} title={t('receivers.detail.not-found-title', 'Receiver not found')} />
        )}
        {notFound && (
          <EmptyState variant="not-found" message={t('receivers.error-loading-title', 'Error loading receivers')}>
            {t('receivers.detail.not-found-message', 'The receiver "{{name}}" does not exist.', { name })}
          </EmptyState>
        )}
        {!isLoading && receiver && !error && (
          <Stack direction="column" gap={2}>
            <Field
              noMargin
              label={t('receivers.detail.name', 'Name')}
              description={t('receivers.detail.name-desc', 'Name of the contact point')}
            >
              <Input value={receiver.name} disabled width={39} />
            </Field>

            <ReceiverIntegrations receiver={receiver} />
          </Stack>
        )}
      </div>
    </AlertmanagerPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    maxWidth: `${theme.breakpoints.values.xl}px`,
  }),
  integrationConfigurationWrapper: css({
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    padding: theme.spacing(2),
  }),
});

export default ReceiverDetail;
