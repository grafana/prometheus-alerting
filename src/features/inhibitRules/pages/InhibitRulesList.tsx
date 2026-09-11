import React, { useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import { css } from '@emotion/css';
import { testIds } from '../../../components/testIds';
import { Button, InteractiveTable, Stack, EmptyState } from '@grafana/ui';
import { useInhibitRules } from '../hooks/useInhibitRules';
import { t } from '@grafana/i18n';
import { DEFAULT_PAGE_SIZE } from '../../../constants';
import {
  type NormalizedInhibitRule,
  type ObjectMatcher,
  formatObjectMatcherForDisplay,
} from '@grafana/external-alertmanager/vanilla';
import { AlertLabel } from '@grafana/alerting';
import { AlertmanagerPage } from '../../../components/AlertmanagerPage';
import { ViewState } from '../../../components/ViewState';
import { DataSourceError } from '../../../components/AlertmanagerError';
import { InhibitRuleDrawer } from '../components/InhibitRuleDrawer';
import { InhibitRuleCreateDrawer } from '../components/InhibitRuleCreateDrawer';
import { isAbilityAllowed } from '../../../access-control/abilities';
import { useAlertmanagerConfigMutationAbility } from '../../../hooks/useAlertmanagerConfigMutationAbility';

const MatchersCell = ({ matchers }: { matchers?: ObjectMatcher[] }) => {
  if (!matchers || matchers.length === 0) {
    return <span>{t('inhibit-rules.no-matchers', 'None')}</span>;
  }

  return (
    <Stack direction="row">
      {matchers.map((matcher, idx) => (
        <AlertLabel
          key={`${formatObjectMatcherForDisplay(matcher)}-${idx}`}
          value={formatObjectMatcherForDisplay(matcher)}
          colorBy="value"
        />
      ))}
    </Stack>
  );
};

function InhibitRulesPage() {
  const { inhibitRules, isLoading, error, isSuccess } = useInhibitRules();
  const canMutateInhibitRules = isAbilityAllowed(useAlertmanagerConfigMutationAbility());
  const [selectedInhibitRule, setSelectedInhibitRule] = useState<NormalizedInhibitRule | null>(null);
  const [selectedInhibitRuleIndex, setSelectedInhibitRuleIndex] = useState<number | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

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
    <AlertmanagerPage subTitle={t('inhibit-rules.page-subtitle', 'Suppress alerts based on other active alerts')}>
      <div data-testid={testIds.inhibitRules.container}>
        {canMutateInhibitRules && (
          <Stack justifyContent="flex-end">
            <Button icon="plus" onClick={() => setIsCreateDrawerOpen(true)}>
              {t('inhibit-rules.add-button', 'Add inhibit rule')}
            </Button>
          </Stack>
        )}
        <ViewState
          isLoading={isLoading}
          isSuccess={isSuccess}
          error={error}
          isEmpty={inhibitRules.length === 0}
          loading={
            <div>
              <Skeleton height={50} style={{ marginBottom: '10px' }} />
              <Skeleton height={120} count={3} style={{ marginBottom: '5px' }} />
            </div>
          }
          renderError={
            <DataSourceError
              error={error}
              title={t('inhibit-rules.error-loading-title', 'Error loading inhibit rules')}
            />
          }
          empty={
            <EmptyState
              message={t('inhibit-rules.no-rules-message', 'No inhibit rules are configured in the Alertmanager.')}
              variant="call-to-action"
            >
              {canMutateInhibitRules && (
                <Button icon="plus" onClick={() => setIsCreateDrawerOpen(true)}>
                  {t('inhibit-rules.add-button', 'Add inhibit rule')}
                </Button>
              )}
            </EmptyState>
          }
        >
          <InteractiveTable
            columns={columns}
            data={inhibitRules}
            getRowId={(rule, index) => `inhibit-rule-${index}`}
            pageSize={DEFAULT_PAGE_SIZE}
          />
        </ViewState>
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

      {isCreateDrawerOpen && <InhibitRuleCreateDrawer onClose={() => setIsCreateDrawerOpen(false)} />}
    </AlertmanagerPage>
  );
}

export default InhibitRulesPage;
