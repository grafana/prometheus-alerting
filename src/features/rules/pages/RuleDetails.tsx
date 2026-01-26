import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { parseIdentifier, DataSourceRuleIdentifier } from '@grafana/external-rules';
import type { PromRuleDTO } from '@grafana/external-rules/vanilla';
import { Alert, LoadingPlaceholder, Text } from '@grafana/ui';
import { PluginPage } from '@grafana/runtime';
import { t } from '@grafana/i18n';
import { AlertLabels } from '@grafana/alerting/unstable';

import { useRuleDetails } from '../hooks/useRuleDetails';
import { RuleDetailsView } from '../components/RuleDetailsView';
import { RuleDetailsTitle } from '../components/RuleDetailsTitle';
import { RuleDetailsSubtitle } from '../components/RuleDetailsSubtitle';
import { RuleActionsButtons } from '../list/components/RuleActionsButtons';
import { useDeleteRuleModal } from '../list/components/DeleteRuleModal';
import { rules as rulesNav, groups as groupsNav } from '../../../utils/navigation';
import { DataSourceRuleGroupIdentifier } from '../../../types/rules';

function RuleDetails() {
  const { ruleIdentifier } = useParams<{ ruleIdentifier: string }>();

  const identifier = useMemo(() => {
    if (!ruleIdentifier) {
      throw new Error('Rule identifier is required');
    }
    const parsed = parseIdentifier(ruleIdentifier, true);
    if (!parsed) {
      throw new Error('Invalid rule identifier format');
    }
    return parsed;
  }, [ruleIdentifier]);

  const { promRule, rulerRule, promGroup, rulerGroup, loading, error, ...meta } = useRuleDetails(identifier);

  const [deleteModal, showDeleteModal] = useDeleteRuleModal();

  const handleDuplicate = (identifier: DataSourceRuleIdentifier) => {
    const cloneUrl = rulesNav.clonePageLink(identifier);
    window.location.href = cloneUrl;
  };

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
        <Alert severity="error" title={t('rule-details.error.loading', 'Error loading rule')}>
          {String(error)}
        </Alert>
      </PluginPage>
    );
  }

  if (!promRule) {
    return (
      <PluginPage
        pageNav={{
          text: t('rule-details.error.not-found', 'Rule not found'),
        }}
      >
        <Alert severity="warning" title={t('rule-details.error.not-found', 'Rule not found')}>
          {t('rule-details.error.not-found-message', 'The requested rule could not be found.')}
        </Alert>
      </PluginPage>
    );
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
      rulerApiEnabled={meta.hasRulerApi}
      onDelete={showDeleteModal}
      onDuplicate={handleDuplicate}
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
        <Text color="primary">
          {t('rule-details.metadata.interval-value', 'Every {{interval}}', { interval })}
        </Text>
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
