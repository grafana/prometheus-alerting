import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { Alert, InteractiveTable, Stack, EmptyState } from '@grafana/ui';
import { useInhibitRules } from '../hooks/useInhibitRules';
import { t } from '@grafana/i18n';
import { DEFAULT_PAGE_SIZE } from '../../../constants';
import {
  type NormalizedInhibitRule,
  type ObjectMatcher,
  stringifyObjectMatcher,
} from '@grafana/external-alertmanager/vanilla';
import { AlertLabel } from '@grafana/alerting';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { InhibitRuleDrawer } from '../components/InhibitRuleDrawer';

const MatchersCell = ({ matchers }: { matchers?: ObjectMatcher[] }) => {
  if (!matchers || matchers.length === 0) {
    return <span>{t('inhibit-rules.no-matchers', 'None')}</span>;
  }

  return (
    <Stack direction="row">
      {matchers.map((matcher, idx) => (
        <AlertLabel key={`${stringifyObjectMatcher(matcher)}-${idx}`} value={stringifyObjectMatcher(matcher)} colorBy="value" />
      ))}
    </Stack>
  );
};

function InhibitRulesPage() {
  const { inhibitRules, isLoading, error } = useInhibitRules();
  const [selectedInhibitRule, setSelectedInhibitRule] = useState<NormalizedInhibitRule | null>(null);
  const [selectedInhibitRuleIndex, setSelectedInhibitRuleIndex] = useState<number | null>(null);

  const clickableCellStyles = css({
    cursor: 'pointer',
  });

  const handleRowClick = (rule: NormalizedInhibitRule, index: number) => {
    setSelectedInhibitRule(rule);
    setSelectedInhibitRuleIndex(index);
  };

  const columns = [
    {
      id: 'source_matchers',
      header: t('inhibit-rules.column.source-matchers', 'Source Matchers'),
      cell: ({ row: { original, index } }: { row: { original: NormalizedInhibitRule; index: number } }) => (
        <div className={clickableCellStyles} onClick={() => handleRowClick(original, index)}>
          <MatchersCell matchers={original.source_matchers} />
        </div>
      ),
    },
    {
      id: 'target_matchers',
      header: t('inhibit-rules.column.target-matchers', 'Target Matchers'),
      cell: ({ row: { original, index } }: { row: { original: NormalizedInhibitRule; index: number } }) => (
        <div className={clickableCellStyles} onClick={() => handleRowClick(original, index)}>
          <MatchersCell matchers={original.target_matchers} />
        </div>
      ),
    },
    {
      id: 'equal',
      header: t('inhibit-rules.column.equal', 'Equal'),
      cell: ({ row: { original, index } }: { row: { original: NormalizedInhibitRule; index: number } }) => (
        <div className={clickableCellStyles} onClick={() => handleRowClick(original, index)}>
          {original.equal && original.equal.length > 0 ? (
            <Stack direction="row" gap={0.5}>
              {original.equal.map((label, idx) => (
                <AlertLabel key={`${label}-${idx}`} value={label} colorBy="value" />
              ))}
            </Stack>
          ) : (
            <span>-</span>
          )}
        </div>
      ),
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
          <InteractiveTable
            columns={columns}
            data={inhibitRules}
            getRowId={(rule, index) => `inhibit-rule-${index}`}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        )}
        {!isLoading && inhibitRules.length === 0 && !error && (
          <EmptyState
            message={t('inhibit-rules.no-rules-message', 'No inhibit rules are configured in the Alertmanager.')}
            variant="call-to-action"
          />
        )}
      </div>
      {selectedInhibitRule && (
        <InhibitRuleDrawer
          inhibitRule={selectedInhibitRule}
          inhibitRuleIndex={selectedInhibitRuleIndex}
          onClose={() => {
            setSelectedInhibitRule(null);
            setSelectedInhibitRuleIndex(null);
          }}
        />
      )}
    </AlertmanagerPage>
  );
}

export default InhibitRulesPage;
