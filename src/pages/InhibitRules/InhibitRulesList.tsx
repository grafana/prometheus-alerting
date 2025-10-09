import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { testIds } from '../../components/testIds';
import { PluginPage } from '@grafana/runtime';
import { Alert, InteractiveTable } from '@grafana/ui';
import { useInhibitRules } from '../../hooks/useInhibitRules';
import { Trans, t } from '@grafana/i18n';
import type { InhibitRule } from '@grafana/external-alertmanager/vanilla';
import { css } from '@emotion/css';

const MatchersCell = ({ matchers }: { matchers?: string[] }) => {
  const matchersContainerStyle = css`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  `;

  const matcherBadgeStyle = css`
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    background-color: rgba(110, 159, 255, 0.15);
    border: 1px solid rgba(110, 159, 255, 0.3);
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    color: #6e9fff;
    white-space: nowrap;
  `;

  if (!matchers || matchers.length === 0) {
    return <>{t('inhibit-rules.no-matchers', 'None')}</>;
  }

  return (
    <div className={matchersContainerStyle}>
      {matchers.map((matcher, index) => (
        <span key={index} className={matcherBadgeStyle}>
          {matcher}
        </span>
      ))}
    </div>
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
    <PluginPage>
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
        {!isLoading && inhibitRules.length > 0 && (
          <InteractiveTable columns={columns} data={inhibitRules} getRowId={(rule, index) => `inhibit-rule-${index}`} />
        )}
        {!isLoading && inhibitRules.length === 0 && !error && (
          <Alert title={t('inhibit-rules.no-rules-title', 'No inhibit rules found')} severity="info">
            <Trans i18nKey="inhibit-rules.no-rules-message">No inhibit rules are configured in the Alertmanager.</Trans>
          </Alert>
        )}
      </div>
    </PluginPage>
  );
}

export default InhibitRulesPage;
