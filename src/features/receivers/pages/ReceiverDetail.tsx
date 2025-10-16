import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { Alert, LinkButton } from '@grafana/ui';
import { useReceivers } from '../hooks/useReceivers';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { t } from '@grafana/i18n';
import { prefixRoute } from '../../../utils/utils.routing';
import { ROUTES } from '../../../constants';

function ReceiverDetail() {
  const { name } = useParams<{ name: string }>();
  const [triggerFetch, { receivers = [], isLoading, error }] = useReceivers();

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const receiver = receivers.find((r) => r.name === name);

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
      <div data-testid={testIds.receivers.detail}>
        {isLoading && <Skeleton height={24} count={10} />}
        {error && (
          <Alert title={t('receivers.error-loading-title', 'Error loading receivers')} severity="error">
            {'error' in error ? error.error : t('receivers.error-loading-message', 'Failed to fetch receivers')}
          </Alert>
        )}
        {notFound && (
          <Alert title={t('receivers.detail.not-found-title', 'Receiver not found')} severity="error">
            {t('receivers.detail.not-found-message', 'The receiver "{{name}}" does not exist.', { name })}
          </Alert>
        )}
        {!isLoading && receiver && !error && (
          <div>
            <pre>{JSON.stringify(receiver, null, 2)}</pre>
          </div>
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default ReceiverDetail;
