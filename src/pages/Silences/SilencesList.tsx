import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { Alert, InteractiveTable, Badge } from '@grafana/ui';
import { useSilences } from '../../hooks/useSilences';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { Trans, t } from '@grafana/i18n';
import { AlertmanagerPage } from '../../components/AlertmanagerPage';

function SilencesPage() {
  const { data: silences, isLoading, error } = useSilences();

  const getStatusBadge = (state: 'expired' | 'active' | 'pending') => {
    const colorMap = {
      active: 'green',
      pending: 'blue',
      expired: 'red',
    } as const;

    return <Badge text={state} color={colorMap[state]} />;
  };

  const formatMatchers = (silence: GettableSilence) => {
    return silence.matchers
      .map((m) => {
        const operator = m.isRegex ? '=~' : m.isEqual === false ? '!=' : '=';
        return `${m.name}${operator}"${m.value}"`;
      })
      .join(', ');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => formatMatchers(original),
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
      id: 'comment',
      header: t('silences.column.comment', 'Comment'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => original.comment,
    },
  ];

  return (
    <AlertmanagerPage>
      <div data-testid={testIds.silences.container}>
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
        {!isLoading && silences && silences.length > 0 && (
          <InteractiveTable columns={columns} data={silences} getRowId={(silence) => silence.id} />
        )}
        {!isLoading && (!silences || silences.length === 0) && !error && (
          <Alert title={t('silences.no-silences-title', 'No silences found')} severity="info">
            <Trans i18nKey="silences.no-silences-message">
              No silences are currently configured in the Alertmanager.
            </Trans>
          </Alert>
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default SilencesPage;
