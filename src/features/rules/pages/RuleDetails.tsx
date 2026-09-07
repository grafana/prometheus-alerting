import React, { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { parseIdentifier, type DataSourceRuleIdentifier } from '@grafana/external-rules/identifiers';
import type { PromRuleDTO } from '@grafana/external-rules/vanilla';
import { Alert, EmptyState, LinkButton, LoadingPlaceholder, Spinner, Stack, Text } from '@grafana/ui';
import { locationService, PluginPage } from '@grafana/runtime';
import { Trans, t } from '@grafana/i18n';
import { AlertLabels } from '@grafana/alerting/unstable';

import { useRuleDetails } from '../hooks/useRuleDetails';
import { useRuleCreationConsistencyCheck } from '../hooks/useRuleConsistencyCheck';
import { RuleDetailsView } from '../components/RuleDetailsView';
import { RuleDetailsTitle } from '../components/RuleDetailsTitle';
import { RuleDetailsSubtitle } from '../components/RuleDetailsSubtitle';
import { RulesErrorAlert } from '../components/RulesErrorAlert';
import { RuleActionsButtons } from '../list/components/RuleActionsButtons';
import { useDeleteRuleModal } from '../list/components/DeleteRuleModal';
import {
  rules as rulesNav,
  groups as groupsNav,
  createListFilterLink,
  silences as silencesNav,
} from '../../../utils/navigation';
import { PLUGIN_BASE_URL, ROUTES } from '../../../constants';
import { DataSourceRuleGroupIdentifier } from '../../../types/rules';

function RuleDetails() {
  const { ruleIdentifier } = useParams<{ ruleIdentifier: string }>();

  const identifier = useMemo(() => (ruleIdentifier ? parseIdentifier(ruleIdentifier, true) : null), [ruleIdentifier]);

  // The identifier comes straight from the URL, so it can be truncated or hand-edited into
  // something we can't read. That's the same dead end as a rule that no longer exists, so show
  // the not-found page instead of blowing up into the app's error boundary.
  if (!identifier) {
    return <RuleNotFound />;
  }

  return <RuleDetailsContent identifier={identifier} />;
}

function RuleDetailsContent({ identifier }: { identifier: DataSourceRuleIdentifier }) {
  const { promRule, rulerRule, promGroup, rulerGroup, loading, error, refetch, ...meta } = useRuleDetails(identifier);

  // Check if the rule is newly created and not yet visible in Prometheus
  // This happens due to eventual consistency between Ruler and Prometheus APIs
  const isNewlyCreated = !loading && !promRule && !!rulerRule;
  const { isConsistent, status: consistencyStatus } = useRuleCreationConsistencyCheck(
    isNewlyCreated ? identifier : null
  );

  // Refetch when consistency check completes
  useEffect(() => {
    if (isNewlyCreated && isConsistent) {
      refetch();
    }
  }, [isNewlyCreated, isConsistent, refetch]);

  // After deleting, the rule URL no longer resolves – go back to the rules list
  const handleDeleted = useCallback(() => {
    locationService.push(`${PLUGIN_BASE_URL}/${ROUTES.Rules}`);
  }, []);

  const [deleteModal, showDeleteModal] = useDeleteRuleModal(handleDeleted);

  const handleDuplicate = useCallback((identifier: DataSourceRuleIdentifier) => {
    const cloneUrl = rulesNav.clonePageLink(identifier);
    window.location.href = cloneUrl;
  }, []);

  const handleSilence = useCallback((_identifier: DataSourceRuleIdentifier, ruleName: string) => {
    const silenceUrl = silencesNav.createForRuleLink(ruleName);
    window.location.href = silenceUrl;
  }, []);

  const pageNav = useMemo(() => {
    if (!promRule) {
      return undefined;
    }

    return {
      text: promRule.name,
      parentItem: {
        text: meta.groupName,
        url: groupsNav.detailsPageLink(meta.dataSourceUid, meta.namespace, meta.groupName),
        parentItem: {
          text: meta.namespace,
          url: createListFilterLink([['namespace', meta.namespace]]),
          parentItem: {
            text: t('alerting.rule-editor.rules', 'Rules'),
            url: '/a/grafana-prometheusalerting-app/rules',
          },
        },
      },
    };
  }, [promRule, meta.groupName, meta.namespace, meta.dataSourceUid]);

  if (loading) {
    return (
      <PluginPage>
        <LoadingPlaceholder text={t('rule-details.loading', 'Loading rule details...')} />
      </PluginPage>
    );
  }

  if (error) {
    return (
      <PluginPage>
        <RulesErrorAlert error={error} title={t('rule-details.error.loading', 'Error loading rule')} />
      </PluginPage>
    );
  }

  // Rule exists in Ruler but not yet in Prometheus (newly created, eventual consistency)
  if (!promRule && rulerRule) {
    return (
      <PluginPage
        pageNav={{
          text: identifier.ruleName,
        }}
      >
        <Alert severity="info" title={t('rule-details.consistency.pending-title', 'Rule is being propagated')}>
          <Stack direction="row" alignItems="center" gap={1}>
            {consistencyStatus === 'checking' && <Spinner size="sm" />}
            <span>
              <Trans i18nKey="rule-details.consistency.pending-message">
                This rule was recently created and is being propagated to the monitoring system. This usually takes a
                few seconds. The page will update automatically.
              </Trans>
            </span>
          </Stack>
        </Alert>
      </PluginPage>
    );
  }

  if (!promRule) {
    return <RuleNotFound />;
  }

  // Setup group identifier for actions
  const groupIdentifier: DataSourceRuleGroupIdentifier = {
    rulesSource: {
      uid: meta.dataSourceUid,
      name: '',
      ruleSourceType: 'datasource',
    },
    namespace: {
      name: meta.namespace,
    },
    groupName: meta.groupName,
    groupOrigin: 'datasource',
  };

  // Calculate interval
  const interval = rulerGroup?.interval ?? (promGroup ? `${promGroup.interval}s` : undefined);

  // Prepare renderTitle with state badge
  const renderTitle = (title: string) => (
    <RuleDetailsTitle
      name={title}
      type={promRule.type}
      state={promRule.type === 'alerting' ? promRule.state : undefined}
      health={promRule.health}
      sourceTenants={rulerGroup?.source_tenants}
    />
  );

  // Prepare subTitle with error alert
  const subTitle = <RuleDetailsSubtitle health={promRule.health} lastError={promRule.lastError} />;

  // Prepare metadata info
  const info = createMetadata(promRule, interval);

  // Prepare actions
  const actions = (
    <RuleActionsButtons
      rule={rulerRule}
      promRule={promRule}
      groupIdentifier={groupIdentifier}
      rulerGroup={rulerGroup}
      onDelete={showDeleteModal}
      onDuplicate={handleDuplicate}
      onSilence={handleSilence}
    />
  );

  return (
    <>
      <PluginPage pageNav={pageNav} renderTitle={renderTitle} subTitle={subTitle} info={info} actions={actions}>
        <RuleDetailsView
          promRule={promRule}
          rulerRule={rulerRule}
          promGroup={promGroup}
          rulerGroup={rulerGroup}
          {...meta}
        />
      </PluginPage>
      {deleteModal}
    </>
  );
}

/**
 * Shown when the URL points at a rule we can't resolve – either the identifier itself is
 * unreadable or no rule matches it. Both cases leave the user stuck, so offer a way back.
 */
function RuleNotFound() {
  return (
    <PluginPage pageNav={{ text: t('rule-details.error.not-found', 'Rule not found') }}>
      <EmptyState
        variant="not-found"
        message={t('rule-details.error.not-found', 'Rule not found')}
        button={
          <LinkButton icon="arrow-left" variant="secondary" href={`${PLUGIN_BASE_URL}/${ROUTES.Rules}`}>
            {t('rule-details.error.back-to-rules', 'Back to rules')}
          </LinkButton>
        }
      >
        {t('rule-details.error.not-found-message', 'The requested rule could not be found.')}
      </EmptyState>
    </PluginPage>
  );
}

// Helper functions

interface PageInfoItem {
  label: string;
  value: React.ReactNode;
}

function createMetadata(promRule: PromRuleDTO, interval?: string): PageInfoItem[] {
  const metadata: PageInfoItem[] = [];

  // Add evaluation interval
  if (interval) {
    metadata.push({
      label: t('rule-details.metadata.interval', 'Evaluation interval'),
      value: (
        <Text color="primary">{t('rule-details.metadata.interval-value', 'Every {{interval}}', { interval })}</Text>
      ),
    });
  }

  // Add labels if present (labels are already in promRule)
  const hasLabels = promRule.labels && Object.keys(promRule.labels).length > 0;
  if (hasLabels && promRule.labels) {
    metadata.push({
      label: t('rule-details.metadata.labels', 'Labels'),
      value: (
        <div aria-label={t('rule-details.metadata.labels-aria', 'Rule labels')}>
          <AlertLabels labels={promRule.labels} size="sm" />
        </div>
      ),
    });
  }

  return metadata;
}

export default RuleDetails;
