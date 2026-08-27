import { css } from '@emotion/css';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';

import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { LinkButton, Stack, Field, Input, useStyles2, EmptyState } from '@grafana/ui';
import { testIds } from '../../../components/testIds';
import { useReceivers } from '../hooks/useReceivers';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { AlertmanagerError } from '../../../components/AlertmanagerError';
import { prefixRoute } from '../../../utils/utils.routing';
import { ROUTES } from '../../../constants';
import type { Receiver } from '@grafana/external-alertmanager/vanilla';
import { ReceiverIntegrations } from '../components/ReceiverDrawer';

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
});

export default ReceiverDetail;
