import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';

import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { InteractiveTable, EmptyState, LinkButton, Stack } from '@grafana/ui';
import { AlertLabel } from '@grafana/alerting';
import { useSilences } from '../hooks/useSilences';
import { useSilencesFilters } from '../hooks/useSilencesFilters';
import type { GettableSilence } from '@grafana/external-alertmanager/vanilla';
import { t } from '@grafana/i18n';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ViewState } from '../../../components/ViewState';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { ROUTES, DEFAULT_PAGE_SIZE } from '../../../constants';
import { prefixRoute } from '../../../utils/utils.routing';
import { getStatusBadge, formatMatchers, formatDateTime } from '../utils/silences.utils';
import { SilenceDrawer } from '../components/SilenceDrawer';
import { SilencesFilters } from '../components/SilencesFilters';

function SilencesPage() {
  const { data: silences = [], isLoading, error, isSuccess } = useSilences();
  const { filters, actions, applyFilters } = useSilencesFilters();
  const [selectedSilence, setSelectedSilence] = useState<GettableSilence | null>(null);

  const clickableCellStyles = css({
    cursor: 'pointer',
  });

  const filteredSilences = applyFilters(silences);

  const columns = [
    {
      id: 'status',
      header: t('silences.column.status', 'Status'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => (
        <div className={clickableCellStyles} onClick={() => setSelectedSilence(original)}>
          {getStatusBadge(original.status.state)}
        </div>
      ),
    },
    {
      id: 'matchers',
      header: t('silences.column.matchers', 'Matchers'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => (
        <div className={clickableCellStyles} onClick={() => setSelectedSilence(original)}>
          <Stack direction="row" gap={0.5}>
            {formatMatchers(original).map((matcher, index) => (
              <AlertLabel key={index} value={matcher} colorBy="value" size="sm" />
            ))}
          </Stack>
        </div>
      ),
    },
    {
      id: 'startsAt',
      header: t('silences.column.starts-at', 'Starts At'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => (
        <div className={clickableCellStyles} onClick={() => setSelectedSilence(original)}>
          {formatDateTime(original.startsAt)}
        </div>
      ),
    },
    {
      id: 'endsAt',
      header: t('silences.column.ends-at', 'Ends At'),
      cell: ({ row: { original } }: { row: { original: GettableSilence } }) => (
        <div className={clickableCellStyles} onClick={() => setSelectedSilence(original)}>
          {formatDateTime(original.endsAt)}
        </div>
      ),
    },
  ];

  return (
    <AlertmanagerPage subTitle={t('pages.silences.subtitle', 'Stop notifications from one or more alerting rules')}>
      <div data-testid={testIds.silences.container}>
        <Stack direction="column" gap={2}>
          <Stack direction="row" gap={2} alignItems="center">
            <LinkButton icon="plus" href={prefixRoute(ROUTES.CreateSilence)}>
              {t('silences.create-button', 'Create Silence')}
            </LinkButton>
            <SilencesFilters filters={filters} actions={actions} />
          </Stack>

          <ViewState
            isLoading={isLoading}
            isSuccess={isSuccess}
            error={error}
            isEmpty={filteredSilences.length === 0}
            loading={
              <div>
                <Skeleton height={50} style={{ marginBottom: '10px' }} />
                <Skeleton height={40} count={5} style={{ marginBottom: '5px' }} />
              </div>
            }
            renderError={
              <DataSourceError error={error} title={t('silences.error-loading-title', 'Error loading silences')} />
            }
            empty={
              <EmptyState
                message={
                  silences.length === 0
                    ? t('silences.no-silences-message', 'No silences are currently configured in the Alertmanager.')
                    : t('silences.no-active-silences-message', 'No active silences found.')
                }
                variant={'call-to-action'}
              />
            }
          >
            <InteractiveTable
              columns={columns}
              data={filteredSilences}
              getRowId={(silence) => silence.id}
              pageSize={DEFAULT_PAGE_SIZE}
            />
          </ViewState>
        </Stack>
      </div>

      {selectedSilence && <SilenceDrawer silence={selectedSilence} onClose={() => setSelectedSilence(null)} />}
    </AlertmanagerPage>
  );
}

export default SilencesPage;
