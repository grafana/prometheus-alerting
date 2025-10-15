import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../../components/testIds';
import { Alert, InteractiveTable, Stack, EmptyState } from '@grafana/ui';
import { useInhibitRules } from '../hooks/useInhibitRules';
import { t } from '@grafana/i18n';
import type { InhibitRule } from '@grafana/external-alertmanager/vanilla';
import { AlertLabel } from '@grafana/alerting';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';

const MatchersCell = ({ matchers }: { matchers?: string[] }) => {
  if (!matchers || matchers.length === 0) {
    return <>{t('inhibit-rules.no-matchers', 'None')}</>;
  }

  return (
    <Stack direction="row">
      {matchers.map((matcher, index) => (
        <AlertLabel key={matcher} value={matcher} colorBy="value" />
      ))}
    </Stack>
  );
};

function InhibitRulesPage() {
  const { inhibitRules, isLoading, error } = useInhibitRules();

  const columns = [
    {
      id: 'source_matchers',
      header: t('inhibit-rules.column.source-matchers', 'Source Matchers'),
      cell: ({ row: { original } }: { row: { original: InhibitRule } }) => (
        <MatchersCell matchers={original.source_matchers} />
      ),
    },
    {
      id: 'target_matchers',
      header: t('inhibit-rules.column.target-matchers', 'Target Matchers'),
      cell: ({ row: { original } }: { row: { original: InhibitRule } }) => (
        <MatchersCell matchers={original.target_matchers} />
      ),
    },
    {
      id: 'equal',
      header: t('inhibit-rules.column.equal', 'Equal'),
      cell: ({ row: { original } }: { row: { original: InhibitRule } }) =>
        original.equal && original.equal.length > 0 ? original.equal.join(', ') : '-',
    },
  ];

  return (
    <AlertmanagerPage>
      <div data-testid={testIds.inhibitRules.container}>
        {isLoading && (
          <div>
            <Skeleton height={50} style={{ marginBottom: '10px' }} />
            <Skeleton height={120} count={3} style={{ marginBottom: '5px' }} />
          </div>
        )}
        {error && (
          <Alert title={t('inhibit-rules.error-loading-title', 'Error loading inhibit rules')} severity="error">
            {error instanceof Error
              ? error.message
              : t('inhibit-rules.error-loading-message', 'Failed to fetch inhibit rules')}
          </Alert>
        )}
        {!isLoading && inhibitRules.length > 0 && !error && (
          <InteractiveTable columns={columns} data={inhibitRules} getRowId={(rule, index) => `inhibit-rule-${index}`} />
        )}
        {!isLoading && inhibitRules.length === 0 && !error && (
          <EmptyState
            message={t('inhibit-rules.no-rules-message', 'No inhibit rules are configured in the Alertmanager.')}
            variant="call-to-action"
          />
        )}
      </div>
    </AlertmanagerPage>
  );
}

export default InhibitRulesPage;
