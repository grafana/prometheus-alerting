import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { Alert, InteractiveTable, EmptyState, LinkButton, Stack, Button, ConfirmModal } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import { useSilences } from '../../hooks/useSilences';
import { alertmanagerApi } from '../../api/alertmanager.endpoints';
import { useAlertmanager } from '../../hooks/useAlertmanager';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { AlertmanagerPage } from '../../components/AlertmanagerPage';
import { ROUTES } from '../../constants';
import { prefixRoute } from '../../utils/utils.routing';
import { getStatusBadge, formatMatchers, formatDateTime } from './silences.utils';

function SilencesPage() {
  const { data: silences, isLoading, error } = useSilences();
  const { uid: dataSourceUID } = useAlertmanager();
  const [deleteSilence] = (alertmanagerApi as any).endpoints.deleteSilence.useMutation();
  const [silenceToExpire, setSilenceToExpire] = useState<GettableSilence | null>(null);

  const handleExpireSilence = async () => {
    if (!silenceToExpire) {
      return;
    }

    try {
      await deleteSilence({ dataSourceUID, silenceId: silenceToExpire.id }).unwrap();
      setSilenceToExpire(null);
    } catch (err) {
      console.error('Failed to expire silence:', err);
    }
  };

  const columns = [
    {
      id: 'status',
      header: t('silences.column.status', 'Status'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => getStatusBadge(original.status.state),
    },
    {
      id: 'matchers',
      header: t('silences.column.matchers', 'Matchers'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => (
        <Stack direction="row" gap={0.5}>
          {formatMatchers(original).map((matcher, index) => (
            <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />
          ))}
        </Stack>
      ),
    },
    {
      id: 'startsAt',
      header: t('silences.column.starts-at', 'Starts At'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => formatDateTime(original.startsAt),
    },
    {
      id: 'endsAt',
      header: t('silences.column.ends-at', 'Ends At'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => formatDateTime(original.endsAt),
    },
    {
      id: 'createdBy',
      header: t('silences.column.created-by', 'Created By'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => original.createdBy,
    },
    {
      id: 'actions',
      header: t('silences.column.actions', 'Actions'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => (
        <Button
          variant="destructive"
          size="sm"
          fill="outline"
          onClick={() => setSilenceToExpire(original)}
          icon="trash-alt"
          disabled={original.status.state === 'expired'}
        >
          {t('silences.expire-button', 'Expire')}
        </Button>
      ),
    },
  ];

  return (
    <AlertmanagerPage subTitle={t('pages.silences.subtitle', 'Stop notifications from one or more alerting rules')}>
      <div data-testid={testIds.silences.container}>
        <Stack direction="column" gap={2} alignItems="flex-end">
          <div>
            <LinkButton icon="plus" href={prefixRoute(ROUTES.CreateSilence)}>
              {t('silences.create-button', 'Create Silence')}
            </LinkButton>
          </div>

          {isLoading && (
            <div>
              <Skeleton height={50} style={{ marginBottom: '10px' }} />
              <Skeleton height={40} count={5} style={{ marginBottom: '5px' }} />
            </div>
          )}
          {error && (
            <Alert title={t('silences.error-loading-title', 'Error loading silences')} severity="error">
              {error instanceof Error ? error.message : t('silences.error-loading-message', 'Failed to fetch silences')}
            </Alert>
          )}
          {!isLoading && silences && silences.length > 0 && !error && (
            <InteractiveTable
              columns={columns}
              data={silences}
              getRowId={(silence) => silence.id}
              renderExpandedRow={(silence) => (
                <div style={{ padding: '12px 16px', backgroundColor: 'rgba(204, 204, 220, 0.07)' }}>
                  <strong>{t('silences.comment-label', 'Comment:')}</strong>
                  <div style={{ marginTop: '8px' }}>{silence.comment}</div>
                </div>
              )}
            />
          )}
          {!isLoading && (!silences || silences.length === 0) && !error && (
            <EmptyState
              message={t('silences.no-silences-message', 'No silences are currently configured in the Alertmanager.')}
              variant={'call-to-action'}
            />
          )}
        </Stack>
      </div>

      {silenceToExpire && (
        <ConfirmModal
          isOpen={true}
          title={t('silences.expire-modal.title', 'Expire Silence')}
          body={
            <div>
              <p>{t('silences.expire-modal.body', 'Are you sure you want to expire this silence?')}</p>
              <div style={{ marginTop: '12px' }}>
                <strong>{t('silences.expire-modal.comment-label', 'Comment:')}</strong> {silenceToExpire.comment}
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <strong>{t('silences.expire-modal.matchers-label', 'Matchers:')}</strong>
                {formatMatchers(silenceToExpire).map((matcher, index) => (
                  <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />
                ))}
              </div>
            </div>
          }
          confirmText={t('silences.expire-modal.confirm', 'Expire')}
          dismissText={t('silences.expire-modal.cancel', 'Cancel')}
          icon="exclamation-triangle"
          onConfirm={handleExpireSilence}
          onDismiss={() => setSilenceToExpire(null)}
          confirmButtonVariant="destructive"
        />
      )}
    </AlertmanagerPage>
  );
}

export default SilencesPage;
